import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import type { ActiveChallenge } from "@/lib/challenges/queries"
import { ago, shortDate } from "@/lib/dates"
import { plural } from "@/lib/plural"
import { cn } from "@/lib/utils"
import { AddNoteDialog, CompleteButton, SessionControls, SetAsideMenu } from "./actions"
import { LiveTimeSpent } from "./live-duration"
import { MarkerCircle } from "./marker-circle"
import { TagList } from "./meta"

/** Full view of an idea in progress (the /active page). */
export function CurrentChallenge({ challenge: c }: { challenge: ActiveChallenge }) {
  return (
    <article className="frame p-5 sm:p-7" aria-labelledby={`cc-${c.id}`}>
      <h2 id={`cc-${c.id}`} className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        <span className="relative inline-block">
          <MarkerCircle className="-inset-x-4 -inset-y-3 h-[calc(100%+1.5rem)] w-[calc(100%+2rem)]" />
          <Link href={`/challenge/${c.id}`} className="relative underline-offset-4 hover:underline">
            {c.title}
          </Link>
        </span>
      </h2>
      <TagList category={c.category} tags={c.tags} className="mt-4" />

      {c.description && (
        <p className="mt-4 max-w-[68ch] leading-relaxed whitespace-pre-line text-muted-foreground">{c.description}</p>
      )}

      {(c.spark || c.lastNote) && (
        <dl className="mt-6 grid max-w-[68ch] gap-4">
          {c.spark && (
            <div>
              <dt className="text-xs text-faint">Почему захотелось</dt>
              <dd className="mt-1 leading-relaxed whitespace-pre-line">{c.spark}</dd>
            </div>
          )}
          {c.lastNote && (
            <div>
              <dt className="text-xs text-faint">Последняя заметка</dt>
              <dd className="mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{c.lastNote}</dd>
            </div>
          )}
        </dl>
      )}

      <dl className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-3 border-t border-rule pt-4">
        <div>
          <dt className="text-xs text-faint">Начата</dt>
          <dd className="mt-1 text-sm" title={c.startedAt?.toISOString()}>
            {shortDate(c.startedAt)} <span className="text-faint">· {ago(c.startedAt)}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-faint">Потрачено</dt>
          <dd className="data mt-1 text-sm">
            <LiveTimeSpent trackedSeconds={c.trackedSeconds} sessionStartedAt={c.sessionStartedAt} />
          </dd>
        </div>
        {c.noteCount > 0 && (
          <div>
            <dt className="text-xs text-faint">Заметки</dt>
            <dd className="mt-1 text-sm">
              <span className="data">{c.noteCount}</span> {plural(c.noteCount, "заметка", "заметки", "заметок")}
            </dd>
          </div>
        )}
        <SessionControls id={c.id} sessionStartedAt={c.sessionStartedAt} />
      </dl>

      <footer className="mt-6 flex flex-wrap items-center gap-2">
        <CompleteButton id={c.id} title={c.title} trackedSeconds={c.trackedSeconds} sessionStartedAt={c.sessionStartedAt} />
        <AddNoteDialog id={c.id} />
        <SetAsideMenu id={c.id} title={c.title} />
        <Link
          href={`/challenge/${c.id}`}
          className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded px-2 text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
        >
          Подробнее
          <ArrowRightIcon className="size-4" />
        </Link>
      </footer>
    </article>
  )
}

/** A wide frame on the ideas page, circled in red: what is in progress. */
export function ActiveStrip({ challenge: c, className }: { challenge: ActiveChallenge; className?: string }) {
  const resume = c.lastNote ?? c.spark ?? c.description
  return (
    <article className={cn("frame flex items-center gap-4 px-5 py-4", className)}>
      <div className="min-w-0 flex-1">
        <span className="relative inline-block max-w-full">
          <MarkerCircle className="-inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)]" />
          <Link
            href={`/challenge/${c.id}`}
            className="relative block truncate font-semibold tracking-tight underline-offset-4 hover:underline"
          >
            {c.title}
          </Link>
        </span>
        {resume && (
          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            {c.lastNote ? <span className="hidden text-faint sm:inline">Последняя заметка: </span> : null}
            {resume}
          </p>
        )}
      </div>
      <span className="data shrink-0 text-sm text-muted-foreground" title="Потрачено">
        <LiveTimeSpent trackedSeconds={c.trackedSeconds} sessionStartedAt={c.sessionStartedAt} />
      </span>
      <Link
        href={`/challenge/${c.id}`}
        aria-label={`Открыть «${c.title}»`}
        className="grid size-9 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:size-11"
      >
        <ArrowRightIcon className="size-4" />
      </Link>
    </article>
  )
}
