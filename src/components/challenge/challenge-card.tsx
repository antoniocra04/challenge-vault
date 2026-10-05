"use client"

import { useState } from "react"
import Link from "next/link"
import { HistoryIcon, MessageSquareTextIcon, PaperclipIcon } from "lucide-react"
import type { ChallengeListItem } from "@/lib/challenges/queries"
import { formatSeconds } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { FavoriteButton, StartChallengeButton } from "./actions"
import { Indicators, TagList } from "./meta"

export function ChallengeCard({ challenge: c, capturedAgo }: { challenge: ChallengeListItem; capturedAgo: string }) {
  const [expanded, setExpanded] = useState(false)
  const exploredBefore = c.startedAt != null

  return (
    <article
      data-backlog-card
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setExpanded((v) => !v)
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card/80 p-5 text-left backdrop-blur-[2px] transition-all duration-200 outline-none",
        "hover:-translate-y-0.5 hover:border-white/15 hover:bg-card hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)]",
        "focus-visible:ring-2 focus-visible:ring-ring",
        expanded ? "border-white/15 bg-card shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)]" : "border-border",
        c.favorite && "border-ember/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <TagList category={c.category} tags={expanded ? c.tags : c.tags.slice(0, 3)} className="min-h-5 pt-0.5" />
        <FavoriteButton id={c.id} favorite={c.favorite} className="-mt-1 -mr-2 shrink-0" />
      </div>

      <h3 className="mt-3 text-[17px] leading-snug font-semibold tracking-tight text-balance">{c.title}</h3>

      {c.description && (
        <p
          className={cn(
            "mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground",
            !expanded && "line-clamp-3",
          )}
        >
          {c.description}
        </p>
      )}

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {c.spark && (
            <blockquote className="mt-4 border-l-2 border-ember/30 pl-3 text-sm text-foreground/80 italic">
              <span className="label-mono mb-1 block text-[10px] not-italic">Spark</span>
              <span className="whitespace-pre-line">“{c.spark}”</span>
            </blockquote>
          )}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-faint">
            <span>captured {capturedAgo}</span>
            {c.noteCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquareTextIcon className="size-3" />
                {c.noteCount}
              </span>
            )}
            {c.attachmentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <PaperclipIcon className="size-3" />
                {c.attachmentCount}
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <StartChallengeButton id={c.id} tabIndex={expanded ? 0 : -1} />
            <Link
              href={`/challenge/${c.id}`}
              tabIndex={expanded ? 0 : -1}
              onClick={(e) => e.stopPropagation()}
              className="px-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              Open →
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <Indicators
          estimatedDuration={c.estimatedDuration}
          requiresLeavingHome={c.requiresLeavingHome}
          requiresMoney={c.requiresMoney}
        />
        {exploredBefore && (
          <span
            className="inline-flex items-center gap-1 font-mono text-[11px] text-ember/70"
            title="You started this before and put it back in the vault"
          >
            <HistoryIcon className="size-3" />
            explored{c.trackedSeconds >= 60 ? ` · ${formatSeconds(c.trackedSeconds)}` : " before"}
          </span>
        )}
      </div>
    </article>
  )
}
