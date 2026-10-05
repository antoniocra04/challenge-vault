import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatEstimate } from "@/lib/duration"

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
  if (!category && tags.length === 0) return null
  const wrap = (key: string, label: string, node: React.ReactNode) =>
    linkable ? (
      <Link key={key} href={`/?topic=${encodeURIComponent(label)}`} className="hover:text-foreground transition-colors">
        {node}
      </Link>
    ) : (
      <span key={key}>{node}</span>
    )
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-muted-foreground", className)}>
      {category &&
        wrap(
          "category",
          category,
          <span className="rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 tracking-wide uppercase text-foreground/80">
            {category}
          </span>,
        )}
      {tags.map((tag) => wrap(tag, tag, <span>#{tag}</span>))}
    </div>
  )
}

export function Indicators({
  estimatedDuration,
  requiresLeavingHome,
  requiresMoney,
  className,
}: {
  estimatedDuration?: number | null
  requiresLeavingHome?: boolean | null
  requiresMoney?: boolean | null
  className?: string
}) {
  const items: { key: string; node: React.ReactNode; title: string }[] = []
  if (estimatedDuration != null)
    items.push({ key: "time", node: formatEstimate(estimatedDuration), title: "Estimated time" })
  if (requiresLeavingHome === false) items.push({ key: "home", node: "🏠", title: "At home" })
  if (requiresLeavingHome === true) items.push({ key: "out", node: "🚶", title: "Requires going outside" })
  if (requiresMoney === true) items.push({ key: "money", node: "💰", title: "Requires money" })
  if (items.length === 0) return null
  return (
    <div className={cn("flex items-center gap-2.5 font-mono text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <span key={i.key} title={i.title} aria-label={i.title}>
          {i.node}
        </span>
      ))}
    </div>
  )
}

export function SectionLabel({
  children,
  count,
  className,
  right,
}: {
  children: React.ReactNode
  count?: number
  className?: string
  right?: React.ReactNode
}) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", className)}>
      <h2 className="label-mono shrink-0">
        {children}
        {count != null && <span className="ml-2 text-faint">({count})</span>}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      {right}
    </div>
  )
}
