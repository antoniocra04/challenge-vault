import { cn } from "@/lib/utils"

/**
 * A hand-drawn red china-marker loop around its parent (which must be
 * positioned). It marks what is in progress — the only job red has.
 */
export function MarkerCircle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      className={cn("marker-circle pointer-events-none absolute -inset-x-2 -inset-y-2.5 h-[calc(100%+1.25rem)] w-[calc(100%+1rem)]", className)}
    >
      <path
        d="M 22 9 C 70 1, 160 2, 190 22 C 202 38, 199 70, 176 89 C 140 101, 54 100, 18 88 C 2 76, -1 33, 16 16 C 24 9, 44 5, 64 5"
        pathLength={1}
        fill="none"
        stroke="var(--marker)"
        strokeWidth={2.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
