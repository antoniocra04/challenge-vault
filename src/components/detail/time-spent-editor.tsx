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
          className="data w-28 rounded-md border border-input bg-label px-2 py-1 text-sm outline-none focus:border-ring"
          aria-label="Потрачено времени"
          aria-invalid={value.trim() !== "" && minutes == null}
        />
        <button type="submit" disabled={pending || minutes == null} className="min-h-8 px-1 text-sm text-foreground underline-offset-2 hover:underline disabled:opacity-40 pointer-coarse:min-h-11">
          сохранить
        </button>
        <button type="button" onClick={() => setEditing(false)} className="min-h-8 px-1 text-sm text-muted-foreground pointer-coarse:min-h-11">
          отмена
        </button>
      </form>
    )
  }

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="data">
        {actualDuration != null ? (
          formatMinutes(actualDuration) || "0 мин"
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
        className="min-h-7 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline pointer-coarse:min-h-10"
      >
        изменить
      </button>
    </span>
  )
}
