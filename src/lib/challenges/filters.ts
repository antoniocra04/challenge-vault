// Backlog browsing state lives in the URL so it survives reloads and can be
// bookmarked. These helpers parse and serialize it.

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Recently updated" },
  { value: "estimate", label: "Estimated time" },
  { value: "random", label: "Random" },
] as const

export const TIME_FILTERS = [
  { value: "30m", label: "< 30m" },
  { value: "1h", label: "< 1h" },
  { value: "1-3h", label: "1–3h" },
  { value: "3h+", label: "3h+" },
] as const

export const LOCATION_FILTERS = [
  { value: "home", label: "🏠 Home" },
  { value: "outside", label: "🚶 Outside" },
] as const

export const MONEY_FILTERS = [
  { value: "free", label: "Free" },
  { value: "money", label: "💰 Requires money" },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]["value"]
export type TimeFilter = (typeof TIME_FILTERS)[number]["value"]
export type LocationFilter = (typeof LOCATION_FILTERS)[number]["value"]
export type MoneyFilter = (typeof MONEY_FILTERS)[number]["value"]

export type BacklogFilters = {
  q: string
  topic: string | null
  time: TimeFilter | null
  location: LocationFilter | null
  money: MoneyFilter | null
  favorites: boolean
  sort: SortOption
  seed: number
}

type RawParams = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function oneOf<T extends string>(value: string | undefined, options: readonly { value: T }[]): T | null {
  return options.find((o) => o.value === value)?.value ?? null
}

export function parseBacklogFilters(params: RawParams): BacklogFilters {
  const seed = Number.parseInt(first(params.seed) ?? "", 10)
  return {
    q: (first(params.q) ?? "").trim().slice(0, 200),
    topic: first(params.topic)?.trim() || null,
    time: oneOf(first(params.time), TIME_FILTERS),
    location: oneOf(first(params.location), LOCATION_FILTERS),
    money: oneOf(first(params.money), MONEY_FILTERS),
    favorites: first(params.fav) === "1",
    sort: oneOf(first(params.sort), SORT_OPTIONS) ?? "newest",
    seed: Number.isFinite(seed) ? seed : 1,
  }
}

export function hasActiveFilters(f: BacklogFilters): boolean {
  return Boolean(f.q || f.topic || f.time || f.location || f.money || f.favorites)
}

/** Minutes range (inclusive min, inclusive max) for a time filter. */
export function timeFilterRange(t: TimeFilter): { min?: number; max?: number } {
  switch (t) {
    case "30m":
      return { max: 30 }
    case "1h":
      return { max: 60 }
    case "1-3h":
      return { min: 61, max: 180 }
    case "3h+":
      return { min: 181 }
  }
}

/** Deterministic PRNG so a shuffled backlog stays stable until reshuffled. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items]
  const rand = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, "").replace(/\s+/g, "-").slice(0, 40)
}

export function parseTags(input: string | string[] | null | undefined): string[] {
  const parts = Array.isArray(input) ? input : (input ?? "").split(/[,\n]/)
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of parts) {
    const tag = normalizeTag(part)
    const key = tag.toLowerCase()
    if (tag && !seen.has(key)) {
      seen.add(key)
      out.push(tag)
    }
  }
  return out
}
