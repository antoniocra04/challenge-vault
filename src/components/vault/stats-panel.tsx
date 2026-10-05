import type { VaultStats } from "@/lib/challenges/stats"
import { formatMinutes } from "@/lib/duration"

function hours(minutes: number) {
  if (minutes === 0) return "0h"
  if (minutes < 60) return formatMinutes(minutes)
  return `${Math.round(minutes / 60)}h`
}

/** Small and secondary on purpose: this is not a productivity dashboard. */
export function StatsPanel({ stats }: { stats: VaultStats }) {
  const max = Math.max(1, ...stats.mostExplored.map((t) => t.minutes))
  return (
    <section className="grid gap-8 rounded-2xl border border-border bg-surface/40 p-6 sm:grid-cols-2">
      <div>
        <h2 className="label-mono mb-4">This year · {stats.year}</h2>
        <dl className="grid max-w-64 gap-2 font-mono text-sm">
          {[
            ["Completed", stats.completedThisYear],
            ["Active", stats.active],
            ["Backlog", stats.backlog],
            ["Time spent", hours(stats.minutesThisYear)],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h2 className="label-mono mb-4">Most explored</h2>
        {stats.mostExplored.length === 0 ? (
          <p className="text-sm text-faint">Nothing explored yet this year. The vault is patient.</p>
        ) : (
          <ul className="grid gap-2.5">
            {stats.mostExplored.map((t) => (
              <li key={t.label} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 font-mono text-xs">
                <span className="truncate text-muted-foreground">{t.label}</span>
                <span className="h-1 overflow-hidden rounded-full bg-white/5">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-ember/40 to-ember/80"
                    style={{ width: `${Math.max(4, (t.minutes / max) * 100)}%` }}
                  />
                </span>
                <span className="text-right tabular-nums">{hours(t.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
