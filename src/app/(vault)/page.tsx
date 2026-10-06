import { ActiveStrip } from "@/components/challenge/current-challenge"
import { ChallengeCard } from "@/components/challenge/challenge-card"
import { SectionHeading } from "@/components/challenge/meta"
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
import { addedAgo } from "@/lib/dates"

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
  const vaultEmpty = statRows.length === 0

  return (
    <div className="grid grid-cols-1 gap-10">
      {active.length > 0 && (
        <section aria-labelledby="active-heading" className="grid grid-cols-1 gap-4">
          <h2 id="active-heading" className="sr-only">
            В работе
          </h2>
          {active.map((c) => (
            <ActiveStrip key={c.id} challenge={c} />
          ))}
        </section>
      )}

      <section aria-labelledby="vault-heading">
        <SectionHeading
          as="h1"
          id="vault-heading"
          count={filtered ? undefined : total}
          right={
            filtered ? (
              <span className="data text-sm text-muted-foreground">
                найдено {backlog.length} из {total}
              </span>
            ) : null
          }
        >
          Идеи
        </SectionHeading>

        {vaultEmpty ? (
          <EmptyVault />
        ) : (
          <>
            <BacklogToolbar filters={filters} topics={topics} />
            {backlog.length === 0 ? (
              <p className="frame px-6 py-12 text-center text-muted-foreground">
                {total === 0 ? "Все идеи сейчас в работе." : "Ничего не найдено. Попробуйте изменить фильтры."}
              </p>
            ) : (
              <div className="grid grid-flow-row-dense grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-2">
                {backlog.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} added={addedAgo(c.createdAt)} />
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
