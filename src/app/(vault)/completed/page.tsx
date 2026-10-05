import type { Metadata } from "next"
import Link from "next/link"
import { TagList } from "@/components/challenge/meta"
import { getChallengesByStatus } from "@/lib/challenges/queries"
import { shortDate } from "@/lib/dates"
import { formatMinutes } from "@/lib/duration"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Completed" }

function Enjoyment({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn("h-2.5 w-1 rounded-full", i < score ? "bg-jade/80" : "bg-white/10")} />
        ))}
      </span>
      <span className="tabular-nums">{score}/10</span>
    </span>
  )
}

export default async function CompletedPage() {
  const items = await getChallengesByStatus("completed")
  const minutes = items.reduce((sum, c) => sum + (c.actualDuration ?? 0), 0)
  const byYear = new Map<number, typeof items>()
  for (const c of items) {
    const y = (c.completedAt ?? c.updatedAt).getFullYear()
    byYear.set(y, [...(byYear.get(y) ?? []), c])
  }

  return (
    <div>
      <header className="mb-12">
        <h1 className="label-mono text-jade">Completed</h1>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-2">
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {items.length}
            <span className="ml-3 align-middle font-mono text-sm tracking-[0.2em] text-muted-foreground uppercase">
              {items.length === 1 ? "challenge" : "challenges"}
            </span>
          </p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {Math.round(minutes / 60)}
            <span className="ml-3 align-middle font-mono text-sm tracking-[0.2em] text-muted-foreground uppercase">
              hours
            </span>
          </p>
        </div>
        <p className="mt-4 max-w-xl text-muted-foreground">All the things you actually went and did.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-muted-foreground">
          The collection starts with the first completed challenge.
        </div>
      ) : (
        [...byYear.entries()].map(([year, list]) => (
          <section key={year} className="mb-14">
            <div className="mb-5 flex items-center gap-4">
              <h2 className="font-mono text-sm tracking-[0.2em] text-muted-foreground">{year}</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              <span className="font-mono text-[11px] text-faint">{list.length}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenge/${c.id}`}
                  className="artifact-card group flex flex-col rounded-2xl border border-border p-6 transition-colors hover:border-jade/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold tracking-tight uppercase transition-colors group-hover:text-jade">
                      {c.title}
                    </h3>
                    <span className="shrink-0 font-mono text-[11px] text-faint">{shortDate(c.completedAt)}</span>
                  </div>
                  <span className="mt-1 font-mono text-[11px] tracking-[0.16em] text-jade uppercase">✓ Completed</span>
                  {c.description && (
                    <p className="mt-4 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{c.description}</p>
                  )}
                  {c.result && (
                    <div className="mt-4">
                      <div className="label-mono mb-1 text-[10px]">Result</div>
                      <p className="line-clamp-4 text-[15px] leading-relaxed whitespace-pre-line">{c.result}</p>
                    </div>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-2 pt-5 font-mono text-xs text-muted-foreground">
                    {c.actualDuration != null && c.actualDuration > 0 && (
                      <span>
                        <span className="label-mono mr-2 text-[10px]">Time</span>
                        <span className="text-foreground">{formatMinutes(c.actualDuration)}</span>
                      </span>
                    )}
                    {c.enjoymentScore != null && (
                      <span className="inline-flex items-center">
                        <span className="label-mono mr-2 text-[10px]">Enjoyment</span>
                        <span className="text-foreground">
                          <Enjoyment score={c.enjoymentScore} />
                        </span>
                      </span>
                    )}
                  </div>
                  <TagList category={c.category} tags={c.tags} className="mt-4" />
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
