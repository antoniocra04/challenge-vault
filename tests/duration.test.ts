import { describe, expect, it } from "vitest"
import { formatClock, formatEstimate, formatMinutes, formatSeconds, parseDuration } from "@/lib/duration"

describe("parseDuration", () => {
  it.each([
    ["90", 90],
    ["45m", 45],
    ["4h", 240],
    ["1h 20m", 80],
    ["1h20m", 80],
    ["1.5h", 90],
    ["1,5h", 90],
    ["1:30", 90],
    ["2ч", 120],
    ["30 мин", 30],
    ["1 ч 20 мин", 80],
    ["1 day", 1440],
    ["~4h", 240],
  ])("parses %s", (input, expected) => {
    expect(parseDuration(input)).toBe(expected)
  })

  it.each(["", "   ", "soon", "2h banana", "h"])("rejects %j", (input) => {
    expect(parseDuration(input)).toBeNull()
  })
})

describe("formatting", () => {
  it("formats minutes", () => {
    expect(formatMinutes(0)).toBe("0 мин")
    expect(formatMinutes(45)).toBe("45 мин")
    expect(formatMinutes(60)).toBe("1 ч")
    expect(formatMinutes(80)).toBe("1 ч 20 мин")
    expect(formatMinutes(null)).toBe("")
  })

  it("formats estimates and seconds", () => {
    expect(formatEstimate(240)).toBe("~4 ч")
    expect(formatSeconds(30)).toBe("<1 мин")
    expect(formatSeconds(3 * 3600 + 42 * 60)).toBe("3 ч 42 мин")
    expect(formatClock(3729)).toBe("1:02:09")
    expect(formatClock(65)).toBe("1:05")
  })

  it("round-trips", () => {
    for (const m of [5, 45, 60, 95, 600]) expect(parseDuration(formatMinutes(m))).toBe(m)
  })
})
