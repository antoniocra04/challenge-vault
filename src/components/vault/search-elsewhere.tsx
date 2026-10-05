import Link from "next/link"
import { SectionLabel } from "@/components/challenge/meta"
import type { ChallengeListItem } from "@/lib/challenges/queries"
import { shortDate } from "@/lib/dates"
import { StatusBadge } from "@/components/challenge/status-badge"

export function SearchElsewhere({ items }: { items: ChallengeListItem[] }) {
  return (
    <div className="mt-10">
      <SectionLabel count={items.length}>Elsewhere in the vault</SectionLabel>
      <ul className="divide-y divide-white/5 rounded-xl border border-border">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/challenge/${c.id}`}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <StatusBadge status={c.status} />
              <span className="flex-1 truncate">{c.title}</span>
              <span className="font-mono text-[11px] text-faint">
                {shortDate(c.completedAt ?? c.abandonedAt ?? c.startedAt ?? c.createdAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
