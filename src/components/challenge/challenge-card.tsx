"use client"

import { useId, useState } from "react"
import { ArrowRightIcon, ChevronDownIcon, HistoryIcon, MessageSquareTextIcon, PaperclipIcon } from "lucide-react"
import type { ChallengeListItem } from "@/lib/challenges/queries"
import { accession } from "@/lib/dates"
import { formatEstimate, formatSeconds } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { FavoriteButton, OpenChallengeLink, StartChallengeButton } from "./actions"
import { TagList } from "./meta"

/**
 * The ruled measurement strip of a specimen label: named fields with hairline
 * dividers. Only fields that are known are printed.
 */
function SpecimenFields({
  estimatedDuration,
  requiresLeavingHome,
  requiresMoney,
}: {
  estimatedDuration: number | null
  requiresLeavingHome: boolean | null
  requiresMoney: boolean | null
}) {
  const fields: { label: string; value: string; data?: boolean }[] = []
  if (estimatedDuration != null) fields.push({ label: "Время", value: formatEstimate(estimatedDuration), data: true })
  if (requiresLeavingHome != null) fields.push({ label: "Где", value: requiresLeavingHome ? "вне дома" : "дома" })
  if (requiresMoney != null) fields.push({ label: "Деньги", value: requiresMoney ? "нужны" : "не нужны" })
  if (fields.length === 0) return null
  return (
    <dl className="grid auto-cols-fr grid-flow-col divide-x divide-rule border-y border-rule">
      {fields.map((f) => (
        <div key={f.label} className="min-w-0 px-2.5 py-2 first:pl-0 last:pr-0">
          <dt className="truncate text-[11px] leading-tight text-faint">{f.label}</dt>
          <dd className={cn("mt-0.5 truncate text-[13px]", f.data && "data")}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** A backlog idea, set as a specimen label: accession, spark, measurements. */
export function ChallengeCard({ challenge: c, waiting }: { challenge: ChallengeListItem; waiting: string }) {
  const [expanded, setExpanded] = useState(false)
  const regionId = useId()
  const lead = c.spark ?? c.description
  const leadIsSpark = c.spark != null

  return (
    <article
      data-backlog-card
      aria-labelledby={`${regionId}-title`}
      className={cn(
        "specimen group relative flex flex-col transition-colors duration-200",
        "hover:border-white/20 hover:bg-label-hi has-[button[aria-expanded=true]]:bg-label-hi",
        c.favorite && "border-cabinet/45",
      )}
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <span className="data text-[13px] font-medium text-cabinet">{accession(c.accession)}</span>
        <span className="text-xs text-faint">{waiting}</span>
        <FavoriteButton id={c.id} favorite={c.favorite} className="relative z-10 -mr-2 ml-auto" />
      </header>

      <h3 id={`${regionId}-title`} className="px-4 pt-1 text-[17px] leading-snug font-semibold tracking-tight text-balance">
        {/* The title is the disclosure; its overlay makes the whole label clickable. */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((v) => !v)}
          className="text-left outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {c.title}
        </button>
      </h3>

      {lead && (
        <p
          className={cn(
            "px-4 pt-2 text-[15px] leading-relaxed whitespace-pre-line",
            leadIsSpark ? "text-foreground/85" : "text-muted-foreground",
            !expanded && "line-clamp-4",
          )}
        >
          {leadIsSpark ? (
            <>
              <span className="sr-only">Искра: </span>«{c.spark}»
            </>
          ) : (
            c.description
          )}
        </p>
      )}

      <div
        id={regionId}
        inert={!expanded}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-250 ease-out",
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {leadIsSpark && c.description && (
            <p className="px-4 pt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{c.description}</p>
          )}
          {(c.noteCount > 0 || c.attachmentCount > 0) && (
            <p className="flex gap-4 px-4 pt-3 text-xs text-muted-foreground">
              {c.noteCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareTextIcon className="size-3.5 text-faint" />
                  <span className="data">{c.noteCount}</span> в журнале
                </span>
              )}
              {c.attachmentCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <PaperclipIcon className="size-3.5 text-faint" />
                  <span className="data">{c.attachmentCount}</span> вложений
                </span>
              )}
            </p>
          )}
          <div className="relative z-10 flex items-center gap-2 px-4 pt-4">
            <StartChallengeButton id={c.id} />
            <OpenChallengeLink id={c.id} className="gap-1.5">
              Открыть
              <ArrowRightIcon className="size-4" />
            </OpenChallengeLink>
          </div>
        </div>
      </div>

      <footer className="mt-auto grid gap-2.5 px-4 pt-4 pb-3">
        <SpecimenFields
          estimatedDuration={c.estimatedDuration}
          requiresLeavingHome={c.requiresLeavingHome}
          requiresMoney={c.requiresMoney}
        />
        {c.startedAt != null && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title="Уже начиналась и вернулась в хранилище">
            <HistoryIcon className="size-3.5 text-cabinet" />
            изучалась
            {c.trackedSeconds >= 60 && <span className="data">· {formatSeconds(c.trackedSeconds)}</span>}
          </p>
        )}
        <div className="flex items-start gap-3">
          <TagList category={c.category} tags={c.tags} className="min-w-0 flex-1" />
          <ChevronDownIcon
            aria-hidden
            className={cn("ml-auto size-4 shrink-0 text-faint transition-transform duration-200", expanded && "rotate-180")}
          />
        </div>
      </footer>
    </article>
  )
}
