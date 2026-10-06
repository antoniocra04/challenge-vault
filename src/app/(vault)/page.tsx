import Link from "next/link"
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
import { waitingFor } from "@/lib/dates"
import { plural } from "@/lib/plural"

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
        <section aria-label="Сейчас в работе" className="grid grid-cols-1 gap-2">
          {active.map((c) => (
            <ActiveStrip key={c.id} challenge={c} />
          ))}
          {active.length >= 3 && (
            <p className="text-sm text-muted-foreground">
              {active.length} {plural(active.length, "огонь горит", "огня горят", "огней горят")} одновременно. Это нормально — но если какой-то остыл, его можно{" "}
              <Link href="/active" className="underline underline-offset-4 hover:text-foreground">
                вернуть в хранилище
              </Link>
              .
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="vault-heading">
        <SectionHeading
          as="h1"
          id="vault-heading"
          count={filtered ? undefined : total}
          right={
            filtered ? (
              <span className="text-sm text-muted-foreground">
                нашлось <span className="data text-foreground">{backlog.length}</span> из{" "}
                <span className="data">{total}</span>
              </span>
            ) : null
          }
        >
          Хранилище
        </SectionHeading>

        {vaultEmpty ? (
          <EmptyVault />
        ) : (
          <>
            <BacklogToolbar filters={filters} topics={topics} />
            {backlog.length === 0 ? (
              <div className="specimen border-dashed px-6 py-12 text-center text-muted-foreground">
                {total === 0
                  ? "Всё из хранилища сейчас в работе. Поймай что-нибудь новое, когда заискрит."
                  : "Ничего не нашлось. Попробуй убрать часть фильтров."}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] items-start gap-4">
                {backlog.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} waiting={waitingFor(c.createdAt)} />
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
