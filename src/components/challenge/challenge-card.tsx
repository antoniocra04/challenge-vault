"use client"

import { useId, useState } from "react"
import { ArrowRightIcon, MessageSquareTextIcon, PaperclipIcon, StarIcon } from "lucide-react"
import type { ChallengeListItem } from "@/lib/challenges/queries"
import { formatSeconds } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { FavoriteButton, OpenChallengeLink, StartChallengeButton } from "./actions"
import { MetaLine, TagList } from "./meta"

/**
 * One frame on the contact sheet: title and why it was wanted, nothing else.
 * Clicking it enlarges it in place to two columns with everything else.
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
        "frame group relative flex min-h-32 flex-col p-3 transition-colors duration-150 hover:bg-label-hi sm:p-4",
        open && "col-span-2 bg-label-hi",
      )}
    >
      <h3
        id={`${id}-title`}
        className={cn("pr-5 font-semibold tracking-tight text-balance", open ? "text-lg sm:text-xl" : "text-sm leading-snug sm:text-[15px]")}
      >
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
      {c.favorite && !open && (
        <StarIcon role="img" aria-label="В избранном" className="absolute top-3 right-3 size-3.5 fill-current sm:top-4 sm:right-4" />
      )}

      {lead && (
        <p className={cn("mt-1.5 text-[13px] leading-snug whitespace-pre-line text-muted-foreground sm:text-sm", !open && "line-clamp-2")}>
          {lead}
        </p>
      )}

      <div id={id} hidden={!open} className="relative z-10">
        {c.spark && c.description && (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{c.description}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StartChallengeButton id={c.id} />
          <OpenChallengeLink id={c.id} className="gap-1.5">
            Подробнее
            <ArrowRightIcon className="size-4" />
          </OpenChallengeLink>
          <FavoriteButton id={c.id} favorite={c.favorite} className="ml-auto" />
        </div>
        <div className="mt-4 grid gap-1.5 border-t border-rule pt-3">
          <MetaLine
            estimatedDuration={c.estimatedDuration}
            requiresLeavingHome={c.requiresLeavingHome}
            requiresMoney={c.requiresMoney}
          />
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{added}</span>
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
          <TagList category={c.category} tags={c.tags} />
        </div>
      </div>
    </article>
  )
}
