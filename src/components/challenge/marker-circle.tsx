import { cn } from "@/lib/utils"

// A few hand-drawn loops; each idea always gets the same one.
const LOOPS = [
  "M 24 10 C 72 1, 162 3, 190 22 C 203 39, 198 71, 175 89 C 139 101, 52 99, 17 87 C 1 74, -1 32, 16 16 C 26 8, 46 5, 66 6",
  "M 30 8 C 80 0, 158 4, 186 19 C 201 33, 201 68, 181 86 C 147 100, 60 101, 21 90 C 3 79, -2 38, 12 20 C 22 9, 50 4, 74 4",
  "M 18 14 C 60 2, 150 0, 184 16 C 202 29, 200 66, 179 87 C 150 99, 66 102, 25 92 C 5 83, -1 44, 9 25 C 15 13, 34 7, 58 5",
]

function pick(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Red china-marker loop around its parent (which must be positioned). It
 * marks what is in progress — the only job red has. Two offset passes give
 * the waxy, uneven line of a grease pencil.
 */
export function MarkerCircle({ seed = "", className }: { seed?: string; className?: string }) {
  const n = pick(seed)
  const d = LOOPS[n % LOOPS.length]
  const tilt = ((n >> 3) % 5) - 2 // -2..2 degrees
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      style={{ rotate: `${tilt * 0.6}deg` }}
      className={cn(
        "marker-circle pointer-events-none absolute -inset-x-2 -inset-y-2.5 h-[calc(100%+1.25rem)] w-[calc(100%+1rem)] overflow-visible",
        className,
      )}
    >
      <path d={d} pathLength={1} fill="none" stroke="var(--marker)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path
        d={d}
        pathLength={1}
        transform="translate(1.5 1.2)"
        fill="none"
        stroke="var(--marker)"
        strokeOpacity={0.45}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
