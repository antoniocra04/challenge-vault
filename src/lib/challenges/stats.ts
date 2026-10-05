import { spentMinutes } from "./time"

type StatsRow = {
  status: "backlog" | "active" | "completed" | "abandoned"
  category: string | null
  tags: string[]
  actualDuration: number | null
  trackedSeconds: number
  sessionStartedAt: Date | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

export type VaultStats = {
  year: number
  completedThisYear: number
  active: number
  backlog: number
  minutesThisYear: number
  mostExplored: { label: string; minutes: number }[]
  completedAllTime: number
  minutesAllTime: number
}

/** The topic a challenge's time is attributed to: category, else first tag. */
export function primaryTopic(row: { category: string | null; tags: string[] }): string {
  return row.category?.trim() || row.tags[0] || "Other"
}

export function computeStats(rows: StatsRow[], now: Date = new Date()): VaultStats {
  const year = now.getFullYear()
  const inYear = (d: Date | null) => d != null && d.getFullYear() === year

  let completedThisYear = 0
  let active = 0
  let backlog = 0
  let minutesThisYear = 0
  let completedAllTime = 0
  let minutesAllTime = 0
  const byTopic = new Map<string, { label: string; minutes: number }>()

  for (const row of rows) {
    if (row.status === "active") active++
    if (row.status === "backlog") backlog++
    if (row.status === "completed") {
      completedAllTime++
      if (inYear(row.completedAt)) completedThisYear++
    }
    const minutes = spentMinutes(row, now)
    minutesAllTime += minutes
    const touchedThisYear = inYear(row.completedAt) || inYear(row.startedAt) || row.status === "active"
    if (minutes > 0 && touchedThisYear) {
      minutesThisYear += minutes
      const label = primaryTopic(row)
      const key = label.toLowerCase()
      const entry = byTopic.get(key) ?? { label, minutes: 0 }
      entry.minutes += minutes
      byTopic.set(key, entry)
    }
  }

  const mostExplored = [...byTopic.values()].sort((a, b) => b.minutes - a.minutes).slice(0, 5)

  return {
    year,
    completedThisYear,
    active,
    backlog,
    minutesThisYear,
    mostExplored,
    completedAllTime,
    minutesAllTime,
  }
}
