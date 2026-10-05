import { and, eq, inArray, sql } from "drizzle-orm"
import type { PgUpdateSetSource } from "drizzle-orm/pg-core"
import { db } from "@/db"
import {
  attachments,
  challengeLogEntries,
  challenges,
  type AttachmentKind,
  type Challenge,
  type ChallengeStatus,
} from "@/db/schema"
import { VaultError } from "./errors"
import {
  abandonInputSchema,
  challengeInputSchema,
  completeInputSchema,
  linkAttachmentSchema,
  logEntryInputSchema,
  textAttachmentSchema,
  type ChallengeInput,
  type CompleteInput,
} from "./schemas"

// Seconds of the running session, computed by the database so every write
// uses the same clock.
const runningSeconds = sql<number>`coalesce(floor(extract(epoch from (now() - ${challenges.sessionStartedAt})))::int, 0)`

/** Column updates that close a running session and bank its time. */
const closeSession = {
  trackedSeconds: sql`${challenges.trackedSeconds} + ${runningSeconds}`,
  sessionStartedAt: null,
}

const now = sql`now()`

async function logEvent(challengeId: string, content: string) {
  await db.insert(challengeLogEntries).values({ challengeId, content, kind: "event" })
}

/**
 * Run a guarded state transition. The WHERE clause makes the update a no-op
 * when the challenge isn't in an allowed state, so double clicks and stale
 * tabs can't corrupt anything.
 */
async function transition(
  id: string,
  from: ChallengeStatus[],
  set: PgUpdateSetSource<typeof challenges>,
  failMessage: string,
): Promise<Challenge> {
  const [row] = await db
    .update(challenges)
    .set({ ...set, updatedAt: now })
    .where(and(eq(challenges.id, id), inArray(challenges.status, from)))
    .returning()
  if (!row) {
    const exists = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.id, id))
    throw new VaultError(exists.length ? failMessage : "This challenge no longer exists.")
  }
  return row
}

async function touch(id: string) {
  await db.update(challenges).set({ updatedAt: now }).where(eq(challenges.id, id))
}

export async function createChallenge(input: ChallengeInput): Promise<Challenge> {
  const data = challengeInputSchema.parse(input)
  const [row] = await db
    .insert(challenges)
    .values({ ...data, favorite: data.favorite ?? false })
    .returning()
  return row
}

export async function updateChallenge(id: string, input: ChallengeInput): Promise<Challenge> {
  const data = challengeInputSchema.parse(input)
  const [row] = await db
    .update(challenges)
    .set({ ...data, updatedAt: now })
    .where(eq(challenges.id, id))
    .returning()
  if (!row) throw new VaultError("This challenge no longer exists.")
  return row
}

/** Deletes a challenge and returns storage keys of its uploaded files. */
export async function deleteChallenge(id: string): Promise<string[]> {
  const files = await db
    .select({ key: attachments.storageKey })
    .from(attachments)
    .where(eq(attachments.challengeId, id))
  await db.delete(challenges).where(eq(challenges.id, id))
  return files.map((f) => f.key).filter((k): k is string => Boolean(k))
}

export async function setFavorite(id: string, favorite: boolean) {
  const [row] = await db
    .update(challenges)
    .set({ favorite })
    .where(eq(challenges.id, id))
    .returning({ id: challenges.id })
  if (!row) throw new VaultError("This challenge no longer exists.")
}

export async function startChallenge(id: string): Promise<Challenge> {
  const [before] = await db
    .select({ startedAt: challenges.startedAt })
    .from(challenges)
    .where(eq(challenges.id, id))
  const row = await transition(
    id,
    ["backlog"],
    {
      status: "active",
      startedAt: sql`coalesce(${challenges.startedAt}, now())`,
      sessionStartedAt: now,
    },
    "Only challenges from the vault can be started.",
  )
  await logEvent(id, before?.startedAt ? "Picked up again" : "Challenge started")
  return row
}

export async function returnToVault(id: string): Promise<Challenge> {
  const row = await transition(
    id,
    ["active"],
    { status: "backlog", ...closeSession },
    "Only an active challenge can go back to the vault.",
  )
  await logEvent(id, "Returned to the vault")
  return row
}

export async function completeChallenge(id: string, input: CompleteInput): Promise<Challenge> {
  const data = completeInputSchema.parse(input)
  const row = await transition(
    id,
    ["active", "backlog"],
    {
      status: "completed",
      ...closeSession,
      startedAt: sql`coalesce(${challenges.startedAt}, now())`,
      completedAt: now,
      result: data.result,
      enjoymentScore: data.enjoymentScore,
      // Default to the tracked time when the user leaves the field empty.
      actualDuration:
        data.actualDuration ??
        sql`round((${challenges.trackedSeconds} + ${runningSeconds}) / 60.0)::int`,
    },
    "This challenge can't be completed from its current state.",
  )
  await logEvent(id, "Completed")
  return row
}

export async function abandonChallenge(id: string, input: { reason?: string | null }) {
  const data = abandonInputSchema.parse(input)
  const row = await transition(
    id,
    ["active", "backlog"],
    { status: "abandoned", ...closeSession, abandonedAt: now, abandonReason: data.reason },
    "This challenge can't be set aside from its current state.",
  )
  await logEvent(id, data.reason ? `Set aside — ${data.reason}` : "Set aside")
  return row
}

/** Put an archived (or completed) challenge back into the backlog. */
export async function restoreToVault(id: string): Promise<Challenge> {
  const row = await transition(
    id,
    ["abandoned", "completed"],
    { status: "backlog", abandonedAt: null, abandonReason: null, completedAt: null },
    "This challenge is already in play.",
  )
  await logEvent(id, "Back in the vault")
  return row
}

export async function pauseSession(id: string, opts: { discard?: boolean } = {}) {
  await transition(
    id,
    ["active"],
    opts.discard ? { sessionStartedAt: null } : closeSession,
    "Only an active challenge has a running session.",
  )
}

export async function resumeSession(id: string) {
  await transition(
    id,
    ["active"],
    { sessionStartedAt: sql`coalesce(${challenges.sessionStartedAt}, now())` },
    "Only an active challenge can run a session.",
  )
}

/** Manually correct the time spent. A running session restarts from now. */
export async function setTrackedMinutes(id: string, minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1_000_000) {
    throw new VaultError("That doesn't look like a valid amount of time.")
  }
  const [row] = await db
    .update(challenges)
    .set({
      trackedSeconds: Math.round(minutes * 60),
      sessionStartedAt: sql`case when ${challenges.sessionStartedAt} is null then null else now() end`,
      actualDuration: sql`case when ${challenges.status} = 'completed' then ${Math.round(minutes)}::int else ${challenges.actualDuration} end`,
      updatedAt: now,
    })
    .where(eq(challenges.id, id))
    .returning({ id: challenges.id })
  if (!row) throw new VaultError("This challenge no longer exists.")
}

export async function addLogEntry(challengeId: string, input: { content: string }) {
  const data = logEntryInputSchema.parse(input)
  const [entry] = await db
    .insert(challengeLogEntries)
    .values({ challengeId, content: data.content, kind: "note" })
    .returning()
  await touch(challengeId)
  return entry
}

export async function deleteLogEntry(entryId: string) {
  const [entry] = await db
    .delete(challengeLogEntries)
    .where(eq(challengeLogEntries.id, entryId))
    .returning({ challengeId: challengeLogEntries.challengeId })
  return entry?.challengeId ?? null
}

export async function addLinkAttachment(challengeId: string, input: { url: string; title?: string | null }) {
  const data = linkAttachmentSchema.parse(input)
  const [row] = await db
    .insert(attachments)
    .values({ challengeId, kind: "url", url: data.url, title: data.title })
    .returning()
  await touch(challengeId)
  return row
}

export async function addTextAttachment(challengeId: string, input: { content: string; title?: string | null }) {
  const data = textAttachmentSchema.parse(input)
  const [row] = await db
    .insert(attachments)
    .values({ challengeId, kind: "text", content: data.content, title: data.title })
    .returning()
  await touch(challengeId)
  return row
}

export async function addFileAttachment(
  challengeId: string,
  file: { kind: AttachmentKind; fileName: string; mimeType: string; size: number; storageKey: string; title?: string | null },
) {
  const [row] = await db
    .insert(attachments)
    .values({ challengeId, ...file, title: file.title ?? null })
    .returning()
  await touch(challengeId)
  return row
}

/** Deletes an attachment and returns its storage key, if it had a file. */
export async function deleteAttachment(attachmentId: string) {
  const [row] = await db
    .delete(attachments)
    .where(eq(attachments.id, attachmentId))
    .returning({ challengeId: attachments.challengeId, storageKey: attachments.storageKey })
  return row ?? null
}

export async function challengeExists(id: string): Promise<boolean> {
  const rows = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.id, id))
  return rows.length > 0
}

export async function updateResult(id: string, input: CompleteInput) {
  const data = completeInputSchema.parse(input)
  const [row] = await db
    .update(challenges)
    .set({
      result: data.result,
      enjoymentScore: data.enjoymentScore,
      actualDuration: data.actualDuration,
      updatedAt: now,
    })
    .where(and(eq(challenges.id, id), eq(challenges.status, "completed")))
    .returning({ id: challenges.id })
  if (!row) throw new VaultError("Only a completed challenge has a result to edit.")
}
