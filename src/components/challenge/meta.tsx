import Link from "next/link"
import { CoinsIcon, FootprintsIcon, HomeIcon, TimerIcon } from "lucide-react"
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
  if (!category && tags.length === 0) return null
  const items = [
    ...(category ? [{ key: `c:${category}`, label: category, text: category, strong: true }] : []),
    ...tags
      .filter((t) => t.toLowerCase() !== category?.toLowerCase())
      .map((t) => ({ key: t, label: t, text: `#${t}`, strong: false })),
  ]
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => {
        const node = <span className={cn(i.strong && "font-medium text-foreground/85")}>{i.text}</span>
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

/** The ruled measurement strip of a specimen label: time, place, money. */
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
  const items: { key: string; icon: React.ReactNode; text: string; data?: boolean }[] = []
  if (estimatedDuration != null)
    items.push({ key: "time", icon: <TimerIcon />, text: formatEstimate(estimatedDuration), data: true })
  if (requiresLeavingHome === false) items.push({ key: "home", icon: <HomeIcon />, text: "дома" })
  if (requiresLeavingHome === true) items.push({ key: "out", icon: <FootprintsIcon />, text: "вне дома" })
  if (requiresMoney === true) items.push({ key: "money", icon: <CoinsIcon />, text: "нужны деньги" })
  if (items.length === 0) return null
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.key} className="inline-flex items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:text-faint">
          {i.icon}
          <span className={cn(i.data && "data")}>{i.text}</span>
        </li>
      ))}
    </ul>
  )
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
    <div className={cn("mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-2", className)}>
      <Tag id={id} className="text-lg font-semibold tracking-tight">
        {children}
      </Tag>
      {count != null && <span className="data text-sm text-faint">{count}</span>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  )
}

/** A labelled field on a specimen label: small label above, value below. */
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
