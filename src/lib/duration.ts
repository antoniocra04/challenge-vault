// Durations are stored in minutes. These helpers turn them into short
// human strings ("1 ч 20 мин") and parse loose user input back.

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return ""
  const total = Math.max(0, Math.round(minutes))
  if (total < 60) return `${total} мин`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m === 0 ? `${h} ч` : `${h} ч ${m} мин`
}

export function formatSeconds(seconds: number): string {
  if (seconds < 60) return seconds <= 0 ? "0 мин" : "<1 мин"
  return formatMinutes(Math.floor(seconds / 60))
}

/** Clock-style "1:02:09" for a running session. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/** "~4h" style estimate label. */
export function formatEstimate(minutes: number | null | undefined): string {
  if (minutes == null) return ""
  return `~${formatMinutes(minutes)}`
}

const UNIT_MINUTES: Record<string, number> = {
  m: 1,
  min: 1,
  mins: 1,
  minute: 1,
  minutes: 1,
  "м": 1,
  "мин": 1,
  h: 60,
  hr: 60,
  hrs: 60,
  hour: 60,
  hours: 60,
  "ч": 60,
  "час": 60,
  "часа": 60,
  "часов": 60,
  d: 60 * 24,
  day: 60 * 24,
  days: 60 * 24,
  "д": 60 * 24,
  "день": 60 * 24,
  "дня": 60 * 24,
  "дней": 60 * 24,
}

/**
 * Parse loose duration input: "90", "90m", "1.5h", "1h 30m", "2ч", "1:30".
 * A bare number is minutes. Returns null for empty / unparseable input.
 */
export function parseDuration(input: string | null | undefined): number | null {
  if (input == null) return null
  const raw = input.trim().toLowerCase().replace(",", ".")
  if (!raw) return null

  const clock = raw.match(/^(\d+):(\d{1,2})$/)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])

  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Math.round(Number(raw))
  }

  const re = /(\d+(?:\.\d+)?)\s*([a-zа-я]+)/gu
  let total = 0
  let matched = false
  let consumed = ""
  for (const match of raw.matchAll(re)) {
    const unit = UNIT_MINUTES[match[2]]
    if (unit == null) return null
    total += Number(match[1]) * unit
    matched = true
    consumed += match[0]
  }
  if (!matched) return null
  // Reject input with leftover garbage such as "2h banana".
  if (raw.replace(/[\s~≈]/g, "").length !== consumed.replace(/\s/g, "").length) return null
  return Math.round(total)
}
