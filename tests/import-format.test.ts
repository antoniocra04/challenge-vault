import { describe, expect, it } from "vitest"
import { renderMarkdown } from "@/lib/transfer/export"
import { parseImport } from "@/lib/transfer/import"

describe("parseImport", () => {
  it("accepts a minimal hand-written file", () => {
    const file = parseImport([{ title: "Сыграть Love You to Death" }])
    expect(file.challenges[0]).toMatchObject({ title: "Сыграть Love You to Death", status: "backlog", tags: [] })
    expect(file.challenges[0].id).toBeUndefined()
  })

  it("drops invalid ids instead of failing", () => {
    const file = parseImport({ challenges: [{ id: "not-a-uuid", title: "x" }] })
    expect(file.challenges[0].id).toBeUndefined()
  })

  it("rejects files without challenges", () => {
    expect(() => parseImport({ hello: "world" })).toThrow(/Challenge Vault export/)
  })

  it("rejects exports from newer versions", () => {
    expect(() => parseImport({ format: "challenge-vault", version: 99, challenges: [] })).toThrow(/newer version/)
  })
})

describe("renderMarkdown", () => {
  it("renders sections, spark, result and log", () => {
    const d = new Date("2026-10-05T21:14:00")
    const md = renderMarkdown(
      [
        {
          id: "1", title: "Smart Apartment", description: "Мониторинг", spark: "ЖКХ", category: "Home", tags: ["home"],
          status: "completed", favorite: true, estimatedDuration: 240, actualDuration: 720, requiresLeavingHome: false,
          requiresMoney: true, result: "Found ~800 ₽/month", enjoymentScore: 9, abandonReason: null, trackedSeconds: 0,
          sessionStartedAt: null, createdAt: d, updatedAt: d, startedAt: d, completedAt: d, abandonedAt: null,
          log: [{ id: "l", challengeId: "1", content: "Поднял MQTT", kind: "note", createdAt: d }],
          attachments: [],
        },
      ],
      d,
    )
    expect(md).toContain("## Completed (1)")
    expect(md).toContain("### ⭐ Smart Apartment")
    expect(md).toContain("> ЖКХ")
    expect(md).toContain("Found ~800 ₽/month")
    expect(md).toContain("**Time spent:** 12h")
    expect(md).toContain("2026-10-05 21:14 — Поднял MQTT")
  })
})
