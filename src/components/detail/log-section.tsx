"use client"

import { useState } from "react"
import { isSameDay } from "date-fns"
import { addLogEntry, deleteLogEntry } from "@/app/actions"
import { ConfirmInline } from "@/components/challenge/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChallengeLogEntry } from "@/db/schema"
import { useAction } from "@/hooks/use-action"
import { dayAndTime, timeOfDay } from "@/lib/dates"
import { cn } from "@/lib/utils"

export function LogSection({ challengeId, entries }: { challengeId: string; entries: ChallengeLogEntry[] }) {
  const [content, setContent] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    if (!content.trim()) return
    run(() => addLogEntry(challengeId, content), { onSuccess: () => setContent("") })
  }

  return (
    <div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Пока пусто. Журнал необязателен, но помогает вспомнить, на чём остановка.
        </p>
      ) : (
        <ol className="relative grid gap-5 border-l border-rule pl-6">
          {entries.map((e, i) => {
            const newDay = i === 0 || !isSameDay(entries[i - 1].createdAt, e.createdAt)
            return (
              <li key={e.id} className="group relative">
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1.5 -left-[28.5px] size-2 rounded-full ring-4 ring-background",
                    e.kind === "event" ? "bg-faint" : "bg-ember",
                  )}
                />
                <div className="flex min-h-7 items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={e.createdAt.toISOString()} suppressHydrationWarning className="data">
                    {newDay ? dayAndTime(e.createdAt) : timeOfDay(e.createdAt)}
                  </time>
                  {e.kind === "note" && (
                    <span className="opacity-100 transition-opacity group-focus-within:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100">
                      <ConfirmInline
                        label="Удалить запись"
                        disabled={pending}
                        onConfirm={() => run(() => deleteLogEntry(e.id))}
                      />
                    </span>
                  )}
                </div>
                {e.kind === "event" ? (
                  <p className="text-sm text-muted-foreground">{e.content}</p>
                ) : (
                  <p className="max-w-[68ch] leading-relaxed whitespace-pre-line text-foreground/90">{e.content}</p>
                )}
              </li>
            )
          })}
        </ol>
      )}

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
          placeholder="Что сделано, что выяснилось, где затык…"
          aria-label="Новая запись в журнале"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="data hidden text-xs text-faint sm:inline">⌘/Ctrl + Enter</span>
          <Button type="submit" variant="outline" disabled={pending || !content.trim()} className="ml-auto">
            Добавить запись
          </Button>
        </div>
      </form>
    </div>
  )
}
