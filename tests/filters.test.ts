import { describe, expect, it } from "vitest"
import { hasActiveFilters, parseBacklogFilters, parseTags, seededShuffle, timeFilterRange } from "@/lib/challenges/filters"
import { computeStats } from "@/lib/challenges/stats"

describe("parseBacklogFilters", () => {
  it("has sensible defaults", () => {
    const f = parseBacklogFilters({})
    expect(f).toMatchObject({ q: "", topic: null, sort: "newest", favorites: false })
    expect(hasActiveFilters(f)).toBe(false)
  })

  it("parses known values and ignores junk", () => {
    const f = parseBacklogFilters({ q: "  llm ", time: "1-3h", location: "mars", money: "free", sort: "random", seed: "42", fav: "1" })
    expect(f).toMatchObject({ q: "llm", time: "1-3h", location: null, money: "free", sort: "random", seed: 42, favorites: true })
    expect(hasActiveFilters(f)).toBe(true)
  })

  it("maps time filters to ranges", () => {
    expect(timeFilterRange("30m")).toEqual({ max: 30 })
    expect(timeFilterRange("3h+")).toEqual({ min: 181 })
  })
})

describe("seededShuffle", () => {
  const items = Array.from({ length: 20 }, (_, i) => i)

  it("is deterministic per seed and keeps all items", () => {
    const a = seededShuffle(items, 7)
    expect(seededShuffle(items, 7)).toEqual(a)
    expect([...a].sort((x, y) => x - y)).toEqual(items)
    expect(seededShuffle(items, 8)).not.toEqual(a)
  })
})

describe("parseTags", () => {
  it("normalizes, keeps case and dedupes case-insensitively", () => {
    expect(parseTags("#home, Hardware,hardware ,  raspberry pi,")).toEqual(["home", "Hardware", "raspberry-pi"])
    expect(parseTags(["AI", "ai", " "])).toEqual(["AI"])
  })
})

describe("computeStats", () => {
  const now = new Date("2026-10-05T12:00:00Z")
  const base = { tags: [], trackedSeconds: 0, sessionStartedAt: null, createdAt: now, startedAt: null, completedAt: null, actualDuration: null }

  it("counts this year and groups time by topic", () => {
    const stats = computeStats(
      [
        { ...base, status: "completed", category: "Hardware", actualDuration: 120, startedAt: now, completedAt: now },
        { ...base, status: "completed", category: "Music", actualDuration: 60, startedAt: new Date("2025-01-01"), completedAt: new Date("2025-01-02") },
        { ...base, status: "active", category: null, tags: ["hardware"], trackedSeconds: 3600, startedAt: now },
        { ...base, status: "backlog", category: "AI" },
      ],
      now,
    )
    expect(stats.completedThisYear).toBe(1)
    expect(stats.completedAllTime).toBe(2)
    expect(stats.active).toBe(1)
    expect(stats.backlog).toBe(1)
    expect(stats.minutesThisYear).toBe(180)
    expect(stats.mostExplored).toEqual([{ label: "Hardware", minutes: 180 }])
  })
})
