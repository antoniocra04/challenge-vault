import type { ChallengeStatus } from "@/db/schema"
import { cn } from "@/lib/utils"

const STYLES: Record<ChallengeStatus, { label: string; className: string; dot: string }> = {
  backlog: { label: "В хранилище", className: "text-cabinet", dot: "bg-cabinet" },
  active: { label: "Сейчас в работе", className: "text-ember", dot: "bg-ember ember-dot" },
  completed: { label: "В коллекции", className: "text-jade", dot: "bg-jade" },
  abandoned: { label: "В архиве", className: "text-muted-foreground", dot: "bg-faint" },
}

export function StatusBadge({ status, className }: { status: ChallengeStatus; className?: string }) {
  const s = STYLES[status]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 text-sm font-medium", s.className, className)}>
      <span className={cn("size-2 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  )
}

export function statusLabel(status: ChallengeStatus) {
  return STYLES[status].label
}
