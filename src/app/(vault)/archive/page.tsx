import type { Metadata } from "next"
import Link from "next/link"
import { RestoreButton } from "@/components/challenge/actions"
import { SectionLabel } from "@/components/challenge/meta"
import { getChallengesByStatus } from "@/lib/challenges/queries"
import { shortDate } from "@/lib/dates"
import { formatSeconds } from "@/lib/duration"

export const metadata: Metadata = { title: "Archive" }

export default async function ArchivePage() {
  const items = await getChallengesByStatus("abandoned")
  return (
    <div>
      <SectionLabel count={items.length}>Archive</SectionLabel>
      <p className="mb-8 max-w-xl text-muted-foreground">
        Ideas that ran their course. Losing interest isn&apos;t failing — it means you learned what you wanted to know,
        or found something better to do.
      </p>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-muted-foreground">
          Nothing set aside yet.
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card/50 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <Link href={`/challenge/${c.id}`} className="font-medium transition-colors hover:text-foreground/70">
                  {c.title}
                </Link>
                <p className="mt-1 font-mono text-[11px] text-faint">
                  {[
                    `set aside ${shortDate(c.abandonedAt)}`,
                    c.abandonReason,
                    c.trackedSeconds >= 60 ? `explored ${formatSeconds(c.trackedSeconds)}` : null,
                    c.noteCount > 0 ? `${c.noteCount} log ${c.noteCount === 1 ? "entry" : "entries"}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <RestoreButton id={c.id} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
