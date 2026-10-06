import Link from "next/link"
import { formatEstimate } from "@/lib/duration"
import { cn } from "@/lib/utils"

export function TagList({
  category,
  tags,
  className,
  linkable = false,
}: {
  category?: string | null
  tags: string[]
  className?: string
  linkable?: boolean
}) {
  const items = [
    ...(category ? [{ key: `c:${category}`, label: category, text: category, strong: true }] : []),
    ...tags
      .filter((t) => t.toLowerCase() !== category?.toLowerCase())
      .map((t) => ({ key: t, label: t, text: `#${t}`, strong: false })),
  ]
  if (items.length === 0) return null
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint", className)}>
      {items.map((i) => {
        const node = <span className={cn(i.strong && "text-muted-foreground")}>{i.text}</span>
        return (
          <li key={i.key}>
            {linkable ? (
              <Link
                href={`/?topic=${encodeURIComponent(i.label)}`}
                className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {node}
              </Link>
            ) : (
              node
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** "≈ 2 ч · дома · нужны деньги" — only what is known. */
export function metaParts({
  estimatedDuration,
  requiresLeavingHome,
  requiresMoney,
}: {
  estimatedDuration?: number | null
  requiresLeavingHome?: boolean | null
  requiresMoney?: boolean | null
}) {
  const parts: string[] = []
  if (estimatedDuration != null) parts.push(formatEstimate(estimatedDuration))
  if (requiresLeavingHome === false) parts.push("дома")
  if (requiresLeavingHome === true) parts.push("не дома")
  if (requiresMoney === true) parts.push("нужны деньги")
  if (requiresMoney === false) parts.push("бесплатно")
  return parts
}

export function MetaLine({ className, ...props }: Parameters<typeof metaParts>[0] & { className?: string }) {
  const parts = metaParts(props)
  if (parts.length === 0) return null
  return <p className={cn("data text-xs text-muted-foreground", className)}>{parts.join(" · ")}</p>
}

/** Section heading with an optional count and a trailing slot. */
export function SectionHeading({
  children,
  count,
  className,
  right,
  as: Tag = "h2",
  id,
}: {
  children: React.ReactNode
  count?: number
  className?: string
  right?: React.ReactNode
  as?: "h1" | "h2"
  id?: string
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-2", className)}>
      <Tag id={id} className={cn("font-semibold tracking-tight", Tag === "h1" ? "text-2xl" : "text-lg")}>
        {children}
      </Tag>
      {count != null && <span className="data text-muted-foreground">{count}</span>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}

/** A labelled value: small label above, value below. */
export function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}
