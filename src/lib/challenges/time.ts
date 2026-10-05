type Trackable = {
  trackedSeconds: number
  sessionStartedAt: Date | null
}

export function runningSessionSeconds(c: Trackable, now: Date = new Date()): number {
  if (!c.sessionStartedAt) return 0
  return Math.max(0, Math.floor((now.getTime() - c.sessionStartedAt.getTime()) / 1000))
}

/** Total time spent including the currently running session. */
export function totalTrackedSeconds(c: Trackable, now: Date = new Date()): number {
  return c.trackedSeconds + runningSessionSeconds(c, now)
}

/** Time a challenge counts for in statistics, in minutes. */
export function spentMinutes(
  c: Trackable & { status: string; actualDuration: number | null },
  now: Date = new Date(),
): number {
  if (c.status === "completed" && c.actualDuration != null) return c.actualDuration
  return Math.round(totalTrackedSeconds(c, now) / 60)
}

/** Total minutes for a challenge as of right now (client-side helper). */
export function currentTrackedMinutes(trackedSeconds: number, sessionStartedAt: Date | string | null): number {
  const running = sessionStartedAt ? (Date.now() - new Date(sessionStartedAt).getTime()) / 1000 : 0
  return Math.round((trackedSeconds + Math.max(0, running)) / 60)
}
