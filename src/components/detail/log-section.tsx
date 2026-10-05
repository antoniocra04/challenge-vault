"use client"

import { useState } from "react"
import { format, isSameDay } from "date-fns"
import { Trash2Icon } from "lucide-react"
import { addLogEntry, deleteLogEntry } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChallengeLogEntry } from "@/db/schema"
import { useAction } from "@/hooks/use-action"
import { cn } from "@/lib/utils"

export function LogSection({
  challengeId,
  entries,
  canAdd,
}: {
  challengeId: string
  entries: ChallengeLogEntry[]
  canAdd: boolean
}) {
  const [content, setContent] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    if (!content.trim()) return
    run(() => addLogEntry(challengeId, content), { onSuccess: () => setContent("") })
  }

  return (
    <div>
      {entries.length === 0 ? (
        <p className="text-sm text-faint">
          Nothing logged yet. Totally optional — but handy for remembering where you stopped.
        </p>
      ) : (
        <ol className="relative grid gap-5 border-l border-white/[0.07] pl-6">
          {entries.map((e, i) => {
            const newDay = i === 0 || !isSameDay(entries[i - 1].createdAt, e.createdAt)
            return (
              <li key={e.id} className="group relative">
                <span
                  className={cn(
                    "absolute top-1.5 -left-[27.5px] size-2 rounded-full ring-4 ring-background",
                    e.kind === "event" ? "bg-white/20" : "bg-ember/80",
                  )}
                />
                <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-faint">
                  <time dateTime={e.createdAt.toISOString()} suppressHydrationWarning>
                    {newDay ? format(e.createdAt, "MMM d · HH:mm") : format(e.createdAt, "HH:mm")}
                  </time>
                  {e.kind === "note" && (
                    <button
                      type="button"
                      aria-label="Delete entry"
                      className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus:opacity-100"
                      onClick={() => {
                        if (confirm("Delete this log entry?")) run(() => deleteLogEntry(e.id))
                      }}
                    >
                      <Trash2Icon className="size-3" />
                    </button>
                  )}
                </div>
                {e.kind === "event" ? (
                  <p className="font-mono text-xs text-muted-foreground">{e.content}</p>
                ) : (
                  <p className="leading-relaxed whitespace-pre-line text-foreground/90">{e.content}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {canAdd && (
        <form
          className="mt-6 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Оказывается холодильник жрёт намного меньше, чем я думал."
            aria-label="New log entry"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-faint">⌘/Ctrl + Enter</span>
            <Button
              type="submit"
              variant="outline"
              disabled={pending || !content.trim()}
              className="font-mono text-xs tracking-[0.12em] uppercase"
            >
              + Add entry
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
