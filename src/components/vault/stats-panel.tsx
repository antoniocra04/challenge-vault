import type { VaultStats } from "@/lib/challenges/stats"
import { formatMinutes } from "@/lib/duration"

function hours(minutes: number) {
  if (minutes === 0) return "0 ч"
  if (minutes < 60) return formatMinutes(minutes)
  return `${Math.round(minutes / 60)} ч`
}

/** Small and secondary: a few numbers for the year, not a dashboard. */
export function StatsPanel({ stats }: { stats: VaultStats }) {
  const max = Math.max(1, ...stats.mostExplored.map((t) => t.minutes))
  return (
    <section aria-labelledby="stats-heading" className="grid gap-8 border-t border-rule pt-8 sm:grid-cols-2">
      <div>
        <h2 id="stats-heading" className="mb-3 text-sm font-semibold">
          <span className="data">{stats.year}</span>
        </h2>
        <dl className="grid max-w-72 gap-1.5 text-sm">
          {[
            ["Сделано", String(stats.completedThisYear)],
            ["В работе", String(stats.active)],
            ["Идей в списке", String(stats.backlog)],
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
          <ul className="grid gap-2">
            {stats.mostExplored.map((t) => (
              <li key={t.label} className="grid grid-cols-[minmax(0,8rem)_1fr_3.5rem] items-center gap-3 text-sm">
                <span className="truncate text-muted-foreground">{t.label}</span>
                <span className="h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
                  <span className="block h-full rounded-full bg-muted-foreground" style={{ width: `${Math.max(4, (t.minutes / max) * 100)}%` }} />
                </span>
                <span className="data text-right">{hours(t.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
