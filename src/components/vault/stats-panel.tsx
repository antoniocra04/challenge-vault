import type { VaultStats } from "@/lib/challenges/stats"
import { formatMinutes } from "@/lib/duration"

function hours(minutes: number) {
  if (minutes === 0) return "0 ч"
  if (minutes < 60) return formatMinutes(minutes)
  return `${Math.round(minutes / 60)} ч`
}

/** Small and secondary: a few numbers for the year, not a dashboard. */
export function StatsPanel({ stats }: { stats: VaultStats }) {
  return (
    <section aria-labelledby="stats-heading" className="grid gap-8 border-t border-rule pt-8 sm:grid-cols-2 sm:gap-12">
      <div>
        <h2 id="stats-heading" className="mb-3 text-sm font-semibold">
          За <span className="data">{stats.year}</span> год
        </h2>
        <dl className="grid gap-1.5 text-sm">
          {[
            ["Сделано", String(stats.completedThisYear)],
            ["Потрачено", hours(stats.minutesThisYear)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="data">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-semibold">Больше всего времени</h2>
        {stats.mostExplored.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пока нет данных.</p>
        ) : (
          <ol className="grid gap-1.5 text-sm">
            {stats.mostExplored.map((t) => (
              <li key={t.label} className="flex items-baseline justify-between gap-4">
                <span className="truncate text-muted-foreground">{t.label}</span>
                <span className="data">{hours(t.minutes)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
