import type { Metadata } from "next"
import Link from "next/link"
import { TagList } from "@/components/challenge/meta"
import { getChallengesByStatus } from "@/lib/challenges/queries"
import { shortDate } from "@/lib/dates"
import { formatMinutes } from "@/lib/duration"
import { plural } from "@/lib/plural"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Сделано" }

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
      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Сделано</h1>
        {items.length > 0 && (
          <p className="data text-muted-foreground">
            {items.length} {plural(items.length, "идея", "идеи", "идей")} · {Math.round(minutes / 60)} ч
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="frame px-6 py-14 text-center text-muted-foreground">Пока ничего не сделано.</p>
      ) : (
        [...byYear.entries()].map(([year, list]) => (
          <section key={year} className="mb-10" aria-labelledby={`year-${year}`}>
            <h2 id={`year-${year}`} className="data mb-3 text-sm font-semibold text-muted-foreground">
              {year}
            </h2>
            <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/challenge/${c.id}`}
                    className={cn(
                      "print flex flex-col p-4 transition-colors hover:bg-label-hi",
                      fresh === c.id && "outline-2 outline-offset-4 outline-marker",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold tracking-tight text-balance">{c.title}</h3>
                      <span className="data shrink-0 text-xs text-faint">{shortDate(c.completedAt)}</span>
                    </div>
                    {c.result && (
                      <p className="mt-2 line-clamp-4 text-sm leading-relaxed whitespace-pre-line">{c.result}</p>
                    )}
                    {c.spark && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        <span className="text-faint">Почему захотелось: </span>
                        {c.spark}
                      </p>
                    )}
                    <p className="data mt-3 text-xs text-muted-foreground">
                      {[
                        c.actualDuration ? `потрачено ${formatMinutes(c.actualDuration)}` : null,
                        c.enjoymentScore != null ? `оценка ${c.enjoymentScore}/10` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <TagList category={c.category} tags={c.tags} className="mt-2" />
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
