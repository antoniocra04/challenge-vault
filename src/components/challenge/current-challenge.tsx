import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import type { ActiveChallenge } from "@/lib/challenges/queries"
import { accession, ago, shortDate } from "@/lib/dates"
import { plural } from "@/lib/plural"
import { cn } from "@/lib/utils"
import { AddNoteDialog, CompleteButton, SessionControls, SetAsideMenu } from "./actions"
import { LiveTimeSpent } from "./live-duration"
import { TagList } from "./meta"

/** Full panel for a challenge under observation (the /active page). */
export function CurrentChallenge({ challenge: c }: { challenge: ActiveChallenge }) {
  return (
    <article className="ember-panel p-5 sm:p-7" aria-labelledby={`cc-${c.id}`}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="data text-xs text-ember">{accession(c.accession)}</span>
        <TagList category={c.category} tags={c.tags} />
      </header>

      <h2 id={`cc-${c.id}`} className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        <Link href={`/challenge/${c.id}`} className="underline-offset-4 transition-colors hover:text-ember hover:underline">
          {c.title}
        </Link>
      </h2>

      {c.description && (
        <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">
          {c.description}
        </p>
      )}

      {(c.spark || c.lastNote) && (
        <dl className="mt-6 grid max-w-[68ch] gap-4 border-t border-rule pt-4">
          {c.spark && (
            <div>
              <dt className="text-xs text-faint">Искра</dt>
              <dd className="mt-1 text-[15px] leading-relaxed whitespace-pre-line text-foreground/90">«{c.spark}»</dd>
            </div>
          )}
          {c.lastNote && (
            <div>
              <dt className="text-xs text-faint">С чего продолжить</dt>
              <dd className="mt-1 line-clamp-3 text-[15px] leading-relaxed whitespace-pre-line">{c.lastNote}</dd>
            </div>
          )}
        </dl>
      )}

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-t border-rule pt-4">
        <div>
          <dt className="text-xs text-faint">Начато</dt>
          <dd className="mt-1 text-sm" title={c.startedAt?.toISOString()}>
            <span className="data">{shortDate(c.startedAt)}</span> <span className="text-faint">· {ago(c.startedAt)}</span>
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
            <dt className="text-xs text-faint">Журнал</dt>
            <dd className="mt-1 text-sm">
              <span className="data">{c.noteCount}</span> {plural(c.noteCount, "запись", "записи", "записей")}
            </dd>
          </div>
        )}
        <div className="self-end">
          <SessionControls id={c.id} sessionStartedAt={c.sessionStartedAt} />
        </div>
      </dl>

      <footer className="mt-6 flex flex-wrap items-center gap-2 border-t border-rule pt-5">
        <CompleteButton
          id={c.id}
          title={c.title}
          accessionNo={c.accession}
          trackedSeconds={c.trackedSeconds}
          sessionStartedAt={c.sessionStartedAt}
        />
        <AddNoteDialog id={c.id} />
        <SetAsideMenu id={c.id} title={c.title} />
        <Link
          href={`/challenge/${c.id}`}
          className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
        >
          Открыть
          <ArrowRightIcon className="size-4" />
        </Link>
      </footer>
    </article>
  )
}

/** Slim strip on the vault: what is under observation, without crowding browsing. */
export function ActiveStrip({ challenge: c, className }: { challenge: ActiveChallenge; className?: string }) {
  const resume = c.lastNote ?? c.spark ?? c.description
  return (
    <article className={cn("ember-panel flex items-center gap-4 px-4 py-3 sm:px-5", className)}>
      <span className="ember-dot size-2 shrink-0 rounded-full bg-ember" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <Link
            href={`/challenge/${c.id}`}
            className="truncate font-semibold tracking-tight underline-offset-4 hover:text-ember hover:underline"
          >
            {c.title}
          </Link>
          <span className="data hidden shrink-0 text-xs text-faint sm:inline">{accession(c.accession)}</span>
        </div>
        {resume && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {c.lastNote ? <span className="text-faint">С чего продолжить: </span> : null}
            {resume}
          </p>
        )}
      </div>
      <span className="data hidden shrink-0 text-sm text-ember sm:inline" title="Потрачено">
        <LiveTimeSpent trackedSeconds={c.trackedSeconds} sessionStartedAt={c.sessionStartedAt} />
      </span>
      <Link
        href={`/challenge/${c.id}`}
        aria-label={`Открыть «${c.title}»`}
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:size-11"
      >
        <ArrowRightIcon className="size-4" />
      </Link>
    </article>
  )
}
