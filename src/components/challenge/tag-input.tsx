"use client"

import { useState } from "react"
import { XIcon } from "lucide-react"
import { parseTags } from "@/lib/challenges/filters"
import { cn } from "@/lib/utils"

export function TagInput({
  value,
  onChange,
  suggestions = [],
  id,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  id?: string
}) {
  const [draft, setDraft] = useState("")

  const commit = (text: string) => {
    const next = parseTags([...value, ...text.split(/[,\s]+/)])
    onChange(next)
    setDraft("")
  }

  const lower = new Set(value.map((t) => t.toLowerCase()))
  const visibleSuggestions = suggestions
    .filter((s) => !lower.has(s.toLowerCase()))
    .filter((s) => !draft || s.toLowerCase().startsWith(draft.toLowerCase()))
    .slice(0, 8)

  return (
    <div>
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-input/30 px-2 py-1.5",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-white/[0.07] px-1.5 py-0.5 text-xs"
          >
            #{tag}
            <button
              type="button"
              aria-label={`Убрать тег ${tag}`}
              className="text-faint hover:text-foreground"
              onClick={() => onChange(value.filter((t) => t !== tag))}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const v = e.target.value
            if (/[,\s]$/.test(v)) commit(v)
            else setDraft(v)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault()
              commit(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={value.length ? "" : "Например: дом, железо"}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {visibleSuggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {visibleSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(parseTags([...value, s]))}
              className="min-h-7 rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:min-h-10"
            >
              +#{s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
