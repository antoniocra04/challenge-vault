import type { ChallengeStatus } from "@/db/schema"
import { cn } from "@/lib/utils"

const STYLES: Record<ChallengeStatus, { label: string; className: string }> = {
  backlog: { label: "In the vault", className: "border-white/10 text-muted-foreground" },
  active: { label: "⚡ Active", className: "border-ember/40 bg-ember/10 text-ember" },
  completed: { label: "✓ Completed", className: "border-jade/30 bg-jade/10 text-jade" },
  abandoned: { label: "Archived", className: "border-white/10 text-faint" },
}

export function StatusBadge({ status, className }: { status: ChallengeStatus; className?: string }) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  )
}
