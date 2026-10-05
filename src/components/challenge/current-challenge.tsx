import Link from "next/link"
import { ArrowUpRightIcon } from "lucide-react"
import type { ActiveChallenge } from "@/lib/challenges/queries"
import { ago, shortDate } from "@/lib/dates"
import { cn } from "@/lib/utils"
import {
  AbandonDialog,
  AddNoteDialog,
  CompleteDialog,
  ReturnToVaultButton,
  SessionControls,
} from "./actions"
import { LiveTimeSpent } from "./live-duration"
import { TagList } from "./meta"

export function CurrentChallenge({
  challenge: c,
  variant = "hero",
}: {
  challenge: ActiveChallenge
  variant?: "hero" | "compact"
}) {
  const hero = variant === "hero"
  return (
    <article className={cn("ember-panel rounded-2xl", hero ? "p-6 sm:p-8" : "p-5 sm:p-6")}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-ember uppercase">
          <span className="ember-dot size-2 rounded-full bg-ember" />⚡ Active
        </span>
        <TagList category={c.category} tags={c.tags} />
      </header>

      <Link href={`/challenge/${c.id}`} className="group block">
        <h3
          className={cn(
            "font-semibold tracking-tight text-balance transition-colors group-hover:text-ember",
            hero ? "text-2xl sm:text-3xl" : "text-xl",
          )}
        >
          {c.title}
          <ArrowUpRightIcon className="ml-1 inline size-5 -translate-y-0.5 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
        </h3>
      </Link>

      {c.description && (
        <p
          className={cn(
            "mt-3 leading-relaxed whitespace-pre-line text-muted-foreground",
            hero ? "max-w-3xl text-[15px]" : "line-clamp-3 text-sm",
          )}
        >
          {c.description}
        </p>
      )}

      {c.spark && (
        <blockquote
          className={cn(
            "mt-5 border-l-2 border-ember/40 pl-4 text-foreground/85 italic",
            hero ? "max-w-3xl text-[15px]" : "line-clamp-2 text-sm",
          )}
        >
          <span className="label-mono mb-1 block text-[10px] not-italic">Spark</span>
          <span className="whitespace-pre-line">“{c.spark}”</span>
        </blockquote>
      )}

      {c.lastNote && (
        <div className="mt-5 max-w-3xl rounded-lg border border-border bg-black/20 px-4 py-3">
          <span className="label-mono text-[10px]">Where you left off</span>
          <p className={cn("mt-1 text-sm whitespace-pre-line text-foreground/80", hero ? "line-clamp-3" : "line-clamp-2")}>
            {c.lastNote}
          </p>
        </div>
      )}

      <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <dt className="label-mono text-[10px]">Started</dt>
          <dd className="mt-1 text-sm" title={c.startedAt?.toISOString()}>
            {shortDate(c.startedAt)} <span className="text-faint">· {ago(c.startedAt)}</span>
          </dd>
        </div>
        <div>
          <dt className="label-mono text-[10px]">Time spent</dt>
          <dd className="mt-1 font-mono text-sm">
            <LiveTimeSpent trackedSeconds={c.trackedSeconds} sessionStartedAt={c.sessionStartedAt} />
          </dd>
        </div>
        {c.noteCount > 0 && (
          <div>
            <dt className="label-mono text-[10px]">Log</dt>
            <dd className="mt-1 font-mono text-sm">
              {c.noteCount} {c.noteCount === 1 ? "entry" : "entries"}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4">
        <SessionControls id={c.id} sessionStartedAt={c.sessionStartedAt} compact={!hero} />
      </div>

      <footer className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/5 pt-5">
        <AddNoteDialog id={c.id} />
        <CompleteDialog
          id={c.id}
          title={c.title}
          trackedSeconds={c.trackedSeconds}
          sessionStartedAt={c.sessionStartedAt}
        />
        <ReturnToVaultButton id={c.id} />
        <AbandonDialog id={c.id} title={c.title} />
        <Link
          href={`/challenge/${c.id}`}
          className="ml-auto font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Open challenge →
        </Link>
      </footer>
    </article>
  )
}
