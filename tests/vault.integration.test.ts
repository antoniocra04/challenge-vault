import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { eq, sql } from "drizzle-orm"

// Runs only when TEST_DATABASE_URL points at a disposable database.
const enabled = Boolean(process.env.TEST_DATABASE_URL)

describe.skipIf(!enabled)("vault (database)", async () => {
  const { db, closeDb } = await import("@/db")
  const { runMigrations } = await import("@/db/migrate")
  const { challenges, challengeLogEntries } = await import("@/db/schema")
  const m = await import("@/lib/challenges/mutations")
  const q = await import("@/lib/challenges/queries")
  const { parseBacklogFilters } = await import("@/lib/challenges/filters")
  const { buildJsonExport } = await import("@/lib/transfer/export")
  const { importVault, parseImport } = await import("@/lib/transfer/import")
  const { VaultError } = await import("@/lib/challenges/errors")

  const backlog = (params: Record<string, string> = {}) => q.getBacklog(parseBacklogFilters(params))

  beforeAll(async () => {
    await runMigrations()
  })
  beforeEach(async () => {
    await db.delete(challenges)
  })
  afterAll(async () => {
    await db.delete(challenges)
    await closeDb()
  })

  it("runs the full lifecycle: capture → start → return → start → complete", async () => {
    const c = await m.createChallenge({ title: "  Smart Apartment ", spark: "ЖКХ", tags: ["home", "#Hardware"] })
    expect(c).toMatchObject({ title: "Smart Apartment", status: "backlog", tags: ["home", "Hardware"] })
    expect(await backlog()).toHaveLength(1)

    const started = await m.startChallenge(c.id)
    expect(started.status).toBe("active")
    expect(started.startedAt).toBeInstanceOf(Date)
    expect(started.sessionStartedAt).toBeInstanceOf(Date)
    expect(await backlog()).toHaveLength(0)
    expect(await q.getActiveChallenges()).toHaveLength(1)

    // Pretend the session has been running for 90 minutes.
    await db.update(challenges).set({ sessionStartedAt: sql`now() - interval '90 minutes'` }).where(eq(challenges.id, c.id))
    await m.addLogEntry(c.id, { content: "Поставил Shelly" })

    const returned = await m.returnToVault(c.id)
    expect(returned.status).toBe("backlog")
    expect(returned.sessionStartedAt).toBeNull()
    expect(returned.trackedSeconds).toBeGreaterThanOrEqual(90 * 60)
    expect(returned.startedAt?.getTime()).toBe(started.startedAt?.getTime())

    const [card] = await backlog()
    expect(card.noteCount).toBe(1)

    const again = await m.startChallenge(c.id)
    expect(again.startedAt?.getTime()).toBe(started.startedAt?.getTime())

    const done = await m.completeChallenge(c.id, { result: "Found 800 ₽/month", enjoymentScore: 9 })
    expect(done).toMatchObject({ status: "completed", enjoymentScore: 9, result: "Found 800 ₽/month" })
    expect(done.actualDuration).toBe(90) // defaults to tracked time
    expect(done.completedAt).toBeInstanceOf(Date)

    const detail = await q.getChallenge(c.id)
    expect(detail?.log.map((e) => [e.kind, e.content])).toEqual([
      ["event", "Начато"],
      ["note", "Поставил Shelly"],
      ["event", "Возвращено в хранилище"],
      ["event", "Снова в работе"],
      ["event", "Завершено"],
    ])
  })

  it("guards invalid transitions", async () => {
    const c = await m.createChallenge({ title: "x" })
    await expect(m.returnToVault(c.id)).rejects.toBeInstanceOf(VaultError)
    await m.startChallenge(c.id)
    await expect(m.startChallenge(c.id)).rejects.toThrow(/Начать можно только/)
    await expect(m.startChallenge(crypto.randomUUID())).rejects.toThrow(/больше нет/)
  })

  it("abandons without judgement and restores to the vault", async () => {
    const c = await m.createChallenge({ title: "Keyboard" })
    const a = await m.abandonChallenge(c.id, { reason: "too expensive" })
    expect(a).toMatchObject({ status: "abandoned", abandonReason: "too expensive" })
    expect(await q.getChallengesByStatus("abandoned")).toHaveLength(1)
    const r = await m.restoreToVault(c.id)
    expect(r).toMatchObject({ status: "backlog", abandonReason: null, abandonedAt: null })
  })

  it("supports multiple active challenges", async () => {
    for (const title of ["a", "b", "c"]) await m.startChallenge((await m.createChallenge({ title })).id)
    expect(await q.getActiveChallenges()).toHaveLength(3)
    expect((await q.getStatusCounts()).active).toBe(3)
  })

  it("tracks sessions: pause, resume, discard and manual correction", async () => {
    const c = await m.createChallenge({ title: "clock" })
    await m.startChallenge(c.id)
    await db.update(challenges).set({ sessionStartedAt: sql`now() - interval '10 minutes'` }).where(eq(challenges.id, c.id))
    await m.pauseSession(c.id)
    let [row] = await db.select().from(challenges).where(eq(challenges.id, c.id))
    expect(row.sessionStartedAt).toBeNull()
    expect(Math.round(row.trackedSeconds / 60)).toBe(10)

    await m.resumeSession(c.id)
    await db.update(challenges).set({ sessionStartedAt: sql`now() - interval '20 hours'` }).where(eq(challenges.id, c.id))
    await m.pauseSession(c.id, { discard: true })
    ;[row] = await db.select().from(challenges).where(eq(challenges.id, c.id))
    expect(Math.round(row.trackedSeconds / 60)).toBe(10)

    await m.setTrackedMinutes(c.id, 125)
    ;[row] = await db.select().from(challenges).where(eq(challenges.id, c.id))
    expect(row.trackedSeconds).toBe(125 * 60)
  })

  it("searches title, spark, result, tags and log entries", async () => {
    const a = await m.createChallenge({ title: "Photo Archive", spark: "vision-модель", tags: ["photography"] })
    const b = await m.createChallenge({ title: "Bass", description: "Love You to Death" })
    await m.addLogEntry(b.id, { content: "холодильник жрёт меньше" })
    await m.addLinkAttachment(a.id, { url: "youtube.com/watch?v=xyz", title: "reference" })

    expect((await backlog({ q: "модель" })).map((c) => c.id)).toEqual([a.id])
    expect((await backlog({ q: "ХОЛОДИЛЬНИК" })).map((c) => c.id)).toEqual([b.id])
    expect((await backlog({ q: "photo love" })).map((c) => c.id)).toEqual([])
    expect((await backlog({ q: "youtube" })).map((c) => c.id)).toEqual([a.id])
    expect((await backlog({ q: "100%" }))).toEqual([])

    await m.startChallenge(b.id)
    await m.completeChallenge(b.id, { result: "сыграл целиком" })
    expect(await backlog({ q: "целиком" })).toEqual([])
    expect((await q.searchElsewhere("целиком")).map((c) => c.id)).toEqual([b.id])
  })

  it("filters by topic, context and favorites, and sorts", async () => {
    await m.createChallenge({ title: "short", category: "Music", estimatedDuration: 20, requiresLeavingHome: false })
    await m.createChallenge({ title: "mid", tags: ["music"], estimatedDuration: 120, requiresMoney: true })
    await m.createChallenge({ title: "long", estimatedDuration: 300, requiresLeavingHome: true, favorite: true })
    const ids = async (p: Record<string, string>) => (await backlog(p)).map((c) => c.title)

    expect(await ids({ topic: "MUSIC" })).toEqual(["mid", "short"])
    expect(await ids({ time: "30m" })).toEqual(["short"])
    expect(await ids({ time: "1-3h" })).toEqual(["mid"])
    expect(await ids({ time: "3h+" })).toEqual(["long"])
    expect(await ids({ location: "outside" })).toEqual(["long"])
    expect(await ids({ location: "home" })).toEqual(["mid", "short"])
    expect(await ids({ money: "money" })).toEqual(["mid"])
    expect(await ids({ money: "free" })).toEqual(["long", "short"])
    expect(await ids({ fav: "1" })).toEqual(["long"])
    expect(await ids({ sort: "oldest" })).toEqual(["short", "mid", "long"])
    expect(await ids({ sort: "estimate" })).toEqual(["short", "mid", "long"])

    const r1 = await ids({ sort: "random", seed: "3" })
    expect(await ids({ sort: "random", seed: "3" })).toEqual(r1)
    expect([...r1].sort()).toEqual(["long", "mid", "short"])

    const topics = await q.getBacklogTopics()
    expect(topics[0]).toMatchObject({ key: "music", count: 2 })
  })

  it("exports and re-imports the whole vault losslessly", async () => {
    const c = await m.createChallenge({ title: "Smart Apartment", spark: "ЖКХ", tags: ["home"], estimatedDuration: 60 })
    await m.startChallenge(c.id)
    await m.addLogEntry(c.id, { content: "MQTT" })
    await m.addTextAttachment(c.id, { title: "parts", content: "Shelly EM" })
    await m.completeChallenge(c.id, { result: "done", enjoymentScore: 8, actualDuration: 30 })
    await m.createChallenge({ title: "Second" })

    const exported = JSON.parse(JSON.stringify(await buildJsonExport({ includeFiles: true })))
    expect(exported).toMatchObject({ format: "challenge-vault", version: 1 })
    expect(exported.challenges).toHaveLength(2)

    // Replace: wipe and restore.
    await m.createChallenge({ title: "Will be wiped" })
    const result = await importVault(parseImport(exported), "replace")
    expect(result).toMatchObject({ challenges: 2, logEntries: 3, attachments: 1 })
    const again = JSON.parse(JSON.stringify(await buildJsonExport({ includeFiles: true })))
    expect(again.challenges).toEqual(exported.challenges)

    // Merge: importing the same file twice doesn't duplicate anything.
    await importVault(parseImport(exported), "merge")
    expect(await db.select().from(challenges)).toHaveLength(2)
    expect(await db.select().from(challengeLogEntries)).toHaveLength(3)

    // Merge adds new hand-written challenges.
    await importVault(parseImport([{ title: "From a file", tags: ["x"] }]), "merge")
    expect(await db.select().from(challenges)).toHaveLength(3)
  })
})
