"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { DicesIcon, Loader2Icon, SearchIcon, SlidersHorizontalIcon, StarIcon, XIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LOCATION_FILTERS,
  MONEY_FILTERS,
  SORT_OPTIONS,
  TIME_FILTERS,
  type BacklogFilters,
} from "@/lib/challenges/filters"
import type { Topic } from "@/lib/challenges/queries"
import { cn } from "@/lib/utils"

const VISIBLE_TOPICS = 10

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide whitespace-nowrap transition-colors",
        active
          ? "border-ember/50 bg-ember/10 text-ember"
          : "border-border text-muted-foreground hover:border-white/15 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function BacklogToolbar({ filters, topics }: { filters: BacklogFilters; topics: Topic[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(filters.q)
  const [allTopics, setAllTopics] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k)
      else next.set(k, v)
    }
    const qs = next.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  // Debounce typing into the URL.
  useEffect(() => {
    if (q === filters.q) return
    const t = setTimeout(() => update({ q: q.trim() || null }), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  // "/" focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== "/" || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const extraFilterCount = [filters.time, filters.location, filters.money].filter(Boolean).length
  const shownTopics = allTopics ? topics : topics.slice(0, VISIBLE_TOPICS)
  // Keep the selected topic visible even if it's not in the top list.
  const selectedHidden =
    filters.topic && !shownTopics.some((t) => t.key === filters.topic!.toLowerCase())
      ? [{ key: filters.topic.toLowerCase(), label: filters.topic, count: 0 }]
      : []

  return (
    <div className="mb-6 grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search challenges…"
            aria-label="Search challenges"
            className="h-9 w-full rounded-lg border border-input bg-input/20 pr-9 pl-9 text-sm transition-colors outline-none placeholder:text-faint focus:border-ring focus:bg-input/30"
          />
          {pending ? (
            <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" />
          ) : (
            <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border px-1.5 font-mono text-[10px] text-faint sm:block">
              /
            </kbd>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-mono text-[11px] tracking-wider uppercase transition-colors",
                extraFilterCount
                  ? "border-ember/40 text-ember"
                  : "border-input text-muted-foreground hover:text-foreground",
              )}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              Context{extraFilterCount ? ` · ${extraFilterCount}` : ""}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-4">
            <FilterGroup label="Time">
              {TIME_FILTERS.map((o) => (
                <Chip key={o.value} active={filters.time === o.value} onClick={() => update({ time: filters.time === o.value ? null : o.value })}>
                  {o.label}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Location">
              {LOCATION_FILTERS.map((o) => (
                <Chip
                  key={o.value}
                  active={filters.location === o.value}
                  onClick={() => update({ location: filters.location === o.value ? null : o.value })}
                >
                  {o.label}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Money">
              {MONEY_FILTERS.map((o) => (
                <Chip key={o.value} active={filters.money === o.value} onClick={() => update({ money: filters.money === o.value ? null : o.value })}>
                  {o.label}
                </Chip>
              ))}
            </FilterGroup>
            {extraFilterCount > 0 && (
              <button
                type="button"
                className="mt-1 font-mono text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => update({ time: null, location: null, money: null })}
              >
                clear context filters
              </button>
            )}
          </PopoverContent>
        </Popover>

        <Select
          value={filters.sort}
          onValueChange={(v) =>
            update({ sort: v === "newest" ? null : v, seed: v === "random" ? String(newSeed()) : null })
          }
        >
          <SelectTrigger className="h-9! w-44 font-mono text-[11px] tracking-wider uppercase" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="font-mono text-xs">
                {o.value === "random" ? "🎲 " : ""}
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          title="Shuffle the backlog — look at old ideas with fresh eyes"
          onClick={() => update({ sort: "random", seed: String(newSeed()) })}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-lg border px-3 font-mono text-[11px] tracking-wider uppercase transition-colors",
            filters.sort === "random"
              ? "border-ember/40 text-ember"
              : "border-input text-muted-foreground hover:text-foreground",
          )}
        >
          <DicesIcon className="size-4" />
          Shuffle
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={!filters.topic && !filters.favorites} onClick={() => update({ topic: null, fav: null })}>
          All
        </Chip>
        <Chip active={filters.favorites} onClick={() => update({ fav: filters.favorites ? null : "1" })}>
          <StarIcon className={cn("-mt-0.5 mr-1 inline size-3", filters.favorites && "fill-current")} />
          Starred
        </Chip>
        {[...selectedHidden, ...shownTopics].map((t) => (
          <Chip
            key={t.key}
            active={filters.topic?.toLowerCase() === t.key}
            onClick={() => update({ topic: filters.topic?.toLowerCase() === t.key ? null : t.label })}
          >
            {t.label}
          </Chip>
        ))}
        {topics.length > VISIBLE_TOPICS && (
          <button
            type="button"
            onClick={() => setAllTopics((v) => !v)}
            className="px-2 font-mono text-[11px] text-faint hover:text-muted-foreground"
          >
            {allTopics ? "less" : `+${topics.length - VISIBLE_TOPICS} more`}
          </button>
        )}
        {(filters.q || filters.topic || filters.favorites || extraFilterCount > 0) && (
          <button
            type="button"
            onClick={() => {
              setQ("")
              update({ q: null, topic: null, fav: null, time: null, location: null, money: null })
            }}
            className="ml-1 inline-flex items-center gap-1 px-2 font-mono text-[11px] text-faint hover:text-muted-foreground"
          >
            <XIcon className="size-3" />
            reset
          </button>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="label-mono mb-2 text-[10px]">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function newSeed() {
  return Math.floor(Math.random() * 1_000_000) + 1
}
