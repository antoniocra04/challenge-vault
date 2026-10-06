import Link from "next/link"
import { SectionHeading } from "@/components/challenge/meta"
import { StatusBadge } from "@/components/challenge/status-badge"
import type { ChallengeListItem } from "@/lib/challenges/queries"
import { accession, shortDate } from "@/lib/dates"

export function SearchElsewhere({ items }: { items: ChallengeListItem[] }) {
  return (
    <section className="mt-12" aria-labelledby="elsewhere-heading">
      <SectionHeading id="elsewhere-heading" count={items.length}>
        Нашлось в других разделах
      </SectionHeading>
      <ul className="specimen divide-y divide-rule">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/challenge/${c.id}`}
              className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <span className="data w-14 text-xs text-faint">{accession(c.accession)}</span>
              <span className="min-w-0 flex-1 truncate">{c.title}</span>
              <StatusBadge status={c.status} className="text-xs" />
              <span className="data text-xs text-faint">
                {shortDate(c.completedAt ?? c.abandonedAt ?? c.startedAt ?? c.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
