"use client"

import { useState } from "react"
import { setTimeSpent } from "@/app/actions"
import { LiveTimeSpent } from "@/components/challenge/live-duration"
import { useAction } from "@/hooks/use-action"
import { currentTrackedMinutes } from "@/lib/challenges/time"
import { formatMinutes, parseDuration } from "@/lib/duration"

export function TimeSpentEditor({
  id,
  trackedSeconds,
  sessionStartedAt,
  actualDuration,
}: {
  id: string
  trackedSeconds: number
  sessionStartedAt: Date | null
  actualDuration: number | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const { pending, run } = useAction()

  if (editing) {
    const minutes = parseDuration(value)
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (minutes == null) return
          run(() => setTimeSpent(id, minutes), { onSuccess: () => setEditing(false) })
        }}
      >
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
          className="w-24 rounded-md border border-input bg-input/30 px-2 py-0.5 font-mono text-sm outline-none focus:border-ring"
          aria-label="Time spent"
          aria-invalid={value.trim() !== "" && minutes == null}
        />
        <button type="submit" disabled={pending || minutes == null} className="font-mono text-[11px] text-ember disabled:opacity-40">
          save
        </button>
        <button type="button" onClick={() => setEditing(false)} className="font-mono text-[11px] text-faint">
          cancel
        </button>
      </form>
    )
  }

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="font-mono">
        {actualDuration != null ? (
          formatMinutes(actualDuration) || "0m"
        ) : (
          <LiveTimeSpent trackedSeconds={trackedSeconds} sessionStartedAt={sessionStartedAt} />
        )}
      </span>
      <button
        type="button"
        onClick={() => {
          const current = actualDuration ?? currentTrackedMinutes(trackedSeconds, sessionStartedAt)
          setValue(current ? formatMinutes(current) : "")
          setEditing(true)
        }}
        className="font-mono text-[10px] tracking-wider text-faint uppercase hover:text-muted-foreground"
      >
        adjust
      </button>
    </span>
  )
}
