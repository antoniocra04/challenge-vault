"use client"

import { useId, useState } from "react"
import { ArrowRightIcon, MessageSquareTextIcon, PaperclipIcon } from "lucide-react"
import type { ChallengeListItem } from "@/lib/challenges/queries"
import { formatSeconds } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { FavoriteButton, OpenChallengeLink, StartChallengeButton } from "./actions"
import { MetaLine, TagList } from "./meta"

/**
 * One frame on the contact sheet. Clicking it enlarges it in place, like a
 * loupe over the sheet: the frame takes two columns and shows everything.
 */
export function ChallengeCard({ challenge: c, added }: { challenge: ChallengeListItem; added: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const lead = c.spark ?? c.description

  return (
    <article
      data-backlog-card
      aria-labelledby={`${id}-title`}
      className={cn(
        "frame group relative flex flex-col p-4 transition-colors duration-150 hover:bg-label-hi",
        open && "bg-label-hi sm:col-span-2",
      )}
    >
      <header className="flex items-center gap-2 text-xs text-faint">
        <span>{added}</span>
        <FavoriteButton id={c.id} favorite={c.favorite} className="relative z-10 -my-1.5 -mr-2 ml-auto" />
      </header>

      <h3 id={`${id}-title`} className={cn("mt-1 font-semibold tracking-tight text-balance", open ? "text-xl" : "text-[15px] leading-snug")}>
        {/* The title is the disclosure; its overlay makes the whole frame clickable. */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="text-left outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {c.title}
        </button>
      </h3>

      {lead && (
        <p className={cn("mt-1.5 text-sm leading-relaxed whitespace-pre-line text-muted-foreground", !open && "line-clamp-3")}>
          {lead}
        </p>
      )}

      <div id={id} hidden={!open} className="relative z-10">
        {c.spark && c.description && (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{c.description}</p>
        )}
        {(c.noteCount > 0 || c.attachmentCount > 0 || c.startedAt) && (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {c.startedAt && (
              <span>
                уже начиналась{c.trackedSeconds >= 60 && <>, потрачено <span className="data">{formatSeconds(c.trackedSeconds)}</span></>}
              </span>
            )}
            {c.noteCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <MessageSquareTextIcon className="size-3.5" />
                заметок: <span className="data">{c.noteCount}</span>
              </span>
            )}
            {c.attachmentCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <PaperclipIcon className="size-3.5" />
                вложений: <span className="data">{c.attachmentCount}</span>
              </span>
            )}
          </p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <StartChallengeButton id={c.id} />
          <OpenChallengeLink id={c.id} className="gap-1.5">
            Подробнее
            <ArrowRightIcon className="size-4" />
          </OpenChallengeLink>
        </div>
      </div>

      <footer className="mt-auto grid gap-1.5 pt-3">
        <MetaLine
          estimatedDuration={c.estimatedDuration}
          requiresLeavingHome={c.requiresLeavingHome}
          requiresMoney={c.requiresMoney}
        />
        <TagList category={c.category} tags={c.tags} />
      </footer>
    </article>
  )
}
