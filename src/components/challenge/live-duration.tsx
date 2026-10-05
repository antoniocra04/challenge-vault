"use client"

import { useEffect, useState } from "react"
import { formatClock, formatSeconds } from "@/lib/duration"

export function useNow(intervalMs: number, enabled: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs, enabled])
  return now
}

/** Total time spent, ticking while a session runs. */
export function LiveTimeSpent({
  trackedSeconds,
  sessionStartedAt,
}: {
  trackedSeconds: number
  sessionStartedAt: Date | string | null
}) {
  const start = sessionStartedAt ? new Date(sessionStartedAt).getTime() : null
  const now = useNow(15_000, start != null)
  const running = start != null ? Math.max(0, Math.floor((now - start) / 1000)) : 0
  return <span suppressHydrationWarning>{formatSeconds(trackedSeconds + running)}</span>
}

/** "0:42:10" clock of the current session. */
export function SessionClock({ sessionStartedAt }: { sessionStartedAt: Date | string }) {
  const start = new Date(sessionStartedAt).getTime()
  const now = useNow(1000, true)
  return (
    <span suppressHydrationWarning className="tabular-nums">
      {formatClock((now - start) / 1000)}
    </span>
  )
}
