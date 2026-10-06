import type { Metadata } from "next"
import Link from "next/link"
import { CheckIcon } from "lucide-react"
import { TagList } from "@/components/challenge/meta"
import { getChallengesByStatus } from "@/lib/challenges/queries"
import { accession, shortDate } from "@/lib/dates"
import { formatMinutes } from "@/lib/duration"
import { plural } from "@/lib/plural"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Коллекция" }

function Enjoyment({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn("h-3 w-1 rounded-full", i < score ? "bg-jade/80" : "bg-white/10")} />
        ))}
      </span>
      <span className="data">{score}/10</span>
    </span>
  )
}

export default async function CompletedPage({ searchParams }: PageProps<"/completed">) {
  const { new: fresh } = await searchParams
  const items = await getChallengesByStatus("completed")
  const minutes = items.reduce((sum, c) => sum + (c.actualDuration ?? 0), 0)
  const byYear = new Map<number, typeof items>()
  for (const c of items) {
    const y = (c.completedAt ?? c.updatedAt).getFullYear()
    byYear.set(y, [...(byYear.get(y) ?? []), c])
  }

  return (
    <div>
      <header className="mb-10 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Коллекция</h1>
        <p className="mt-2 text-muted-foreground">
          Всё, что получилось сделать.
          {items.length > 0 && (
            <>
              {" "}
              <span className="data text-foreground">{items.length}</span>{" "}
              {plural(items.length, "находка", "находки", "находок")} и{" "}
              <span className="data text-foreground">{Math.round(minutes / 60)}</span> ч исследований.
            </>
          )}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="specimen border-dashed px-6 py-14 text-center text-muted-foreground">
          Коллекция начнётся с первой завершённой идеи.
        </div>
      ) : (
        [...byYear.entries()].map(([year, list]) => (
          <section key={year} className="mb-12" aria-labelledby={`year-${year}`}>
            <div className="mb-4 flex items-baseline gap-3 border-b border-rule pb-2">
              <h2 id={`year-${year}`} className="data text-sm text-muted-foreground">
                {year}
              </h2>
              <span className="data ml-auto text-xs text-faint">{list.length}</span>
            </div>
            <ul className="grid items-start gap-4 md:grid-cols-2">
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/challenge/${c.id}`}
                    className={cn(
                      "catalogued group flex flex-col p-5 transition-colors hover:bg-label-hi",
                      fresh === c.id && "catalogue-in ring-2 ring-jade/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="data text-jade">{accession(c.accession)}</span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CheckIcon className="size-3.5 text-jade" />
                        <span className="data">{shortDate(c.completedAt)}</span>
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold tracking-tight text-balance group-hover:text-jade">
                      {c.title}
                    </h3>
                    {c.result ? (
                      <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed whitespace-pre-line text-foreground/90">
                        {c.result}
                      </p>
                    ) : c.description ? (
                      <p className="mt-2 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">{c.description}</p>
                    ) : null}
                    {c.spark && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        <span className="text-faint">Искра: </span>«{c.spark}»
                      </p>
                    )}
                    <dl className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-rule pt-3 text-sm [&:not(:first-child)]:mt-4">
                      {c.actualDuration != null && c.actualDuration > 0 && (
                        <div className="flex items-baseline gap-2">
                          <dt className="text-xs text-faint">Потрачено</dt>
                          <dd className="data">{formatMinutes(c.actualDuration)}</dd>
                        </div>
                      )}
                      {c.enjoymentScore != null && (
                        <div className="flex items-center gap-2">
                          <dt className="text-xs text-faint">Интерес</dt>
                          <dd>
                            <Enjoyment score={c.enjoymentScore} />
                          </dd>
                        </div>
                      )}
                    </dl>
                    <TagList category={c.category} tags={c.tags} className="mt-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
