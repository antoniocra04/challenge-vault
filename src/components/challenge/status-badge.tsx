import type { ChallengeStatus } from "@/db/schema"
import { cn } from "@/lib/utils"

const STYLES: Record<ChallengeStatus, { label: string; className: string; dot: string }> = {
  backlog: { label: "Не начата", className: "text-muted-foreground", dot: "bg-faint" },
  active: { label: "В работе", className: "text-marker", dot: "bg-marker marker-dot" },
  completed: { label: "Сделано", className: "text-print", dot: "bg-print" },
  abandoned: { label: "В архиве", className: "text-faint", dot: "border border-faint" },
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
