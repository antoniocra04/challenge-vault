import { CurrentChallenge } from "@/components/challenge/current-challenge"
import { ChallengeCard } from "@/components/challenge/challenge-card"
import { SectionLabel } from "@/components/challenge/meta"
import { BacklogToolbar } from "@/components/vault/backlog-toolbar"
import { EmptyVault } from "@/components/vault/empty-state"
import { SearchElsewhere } from "@/components/vault/search-elsewhere"
import { StatsPanel } from "@/components/vault/stats-panel"
import { hasActiveFilters, parseBacklogFilters } from "@/lib/challenges/filters"
import {
  countBacklog,
  getActiveChallenges,
  getAllChallengesForStats,
  getBacklog,
  getBacklogTopics,
  searchElsewhere,
} from "@/lib/challenges/queries"
import { computeStats } from "@/lib/challenges/stats"
import { ago } from "@/lib/dates"

export default async function VaultPage({ searchParams }: PageProps<"/">) {
  const filters = parseBacklogFilters(await searchParams)
  const [active, backlog, total, topics, elsewhere, statRows] = await Promise.all([
    getActiveChallenges(),
    getBacklog(filters),
    countBacklog(),
    getBacklogTopics(),
    filters.q ? searchElsewhere(filters.q) : Promise.resolve([]),
    getAllChallengesForStats(),
  ])
  const filtered = hasActiveFilters(filters)
  const vaultEmpty = total === 0 && active.length === 0 && statRows.length === 0

  return (
    <div className="grid gap-14">
      {active.length > 0 && (
        <section>
          <SectionLabel count={active.length > 1 ? active.length : undefined}>Currently exploring</SectionLabel>
          {active.length === 1 ? (
            <CurrentChallenge challenge={active[0]} />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {active.map((c) => (
                <CurrentChallenge key={c.id} challenge={c} variant="compact" />
              ))}
            </div>
          )}
          {active.length >= 3 && (
            <p className="mt-4 font-mono text-xs text-faint">
              {active.length} fires lit at once. Totally allowed — but if one has gone cold, it can go back to the vault.
            </p>
          )}
        </section>
      )}

      <section>
        <SectionLabel
          count={filtered ? undefined : total}
          right={
            filtered ? (
              <span className="font-mono text-[11px] text-faint">
                {backlog.length} of {total}
              </span>
            ) : null
          }
        >
          Backlog
        </SectionLabel>

        {vaultEmpty ? (
          <EmptyVault />
        ) : (
          <>
            <BacklogToolbar filters={filters} topics={topics} />
            {backlog.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center text-muted-foreground">
                {total === 0
                  ? "Everything in the vault is in play right now. Capture something new when it sparks."
                  : "Nothing in the backlog matches. Try fewer filters."}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] items-start gap-4">
                {backlog.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} capturedAgo={ago(c.createdAt)} />
                ))}
              </div>
            )}
          </>
        )}

        {filters.q && elsewhere.length > 0 && <SearchElsewhere items={elsewhere} />}
      </section>

      {!vaultEmpty && <StatsPanel stats={computeStats(statRows)} />}
    </div>
  )
}
