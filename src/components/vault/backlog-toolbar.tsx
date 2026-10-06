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

const VISIBLE_TOPICS = 6

const control =
  "inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors pointer-coarse:h-11"

function Chip({
  active,
  onClick,
  children,
  className,
  ...rest
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
} & Omit<React.ComponentProps<"button">, "onClick">) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors pointer-coarse:min-h-11",
        active
          ? "border-cabinet/60 bg-cabinet/15 text-foreground"
          : "border-border text-muted-foreground hover:border-white/25 hover:text-foreground",
        className,
      )}
      {...rest}
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

  // "/" focuses search — by physical key, so it also works on a Russian layout.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return
      if (e.key !== "/" && e.code !== "Slash") return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const contextFilters = [
    filters.time && { key: "time", label: TIME_FILTERS.find((o) => o.value === filters.time)!.label },
    filters.location && { key: "location", label: LOCATION_FILTERS.find((o) => o.value === filters.location)!.label },
    filters.money && { key: "money", label: MONEY_FILTERS.find((o) => o.value === filters.money)!.label },
  ].filter(Boolean) as { key: string; label: string }[]

  const shownTopics = allTopics ? topics : topics.slice(0, VISIBLE_TOPICS)
  const selectedHidden =
    filters.topic && !shownTopics.some((t) => t.key === filters.topic!.toLowerCase())
      ? [{ key: filters.topic.toLowerCase(), label: filters.topic, count: 0 }]
      : []
  const anyFilter = Boolean(filters.q || filters.topic || filters.favorites || contextFilters.length)
  const sortOptions = SORT_OPTIONS.filter((o) => o.value !== "random" || filters.sort === "random")

  return (
    <div className="mb-6 grid grid-cols-1 gap-3" role="search" aria-label="Поиск и фильтры">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Искать в хранилище…"
            aria-label="Искать в хранилище"
            className="h-10 w-full rounded-md border border-input bg-label/70 pr-10 pl-9 text-[15px] transition-colors outline-none focus:border-ring pointer-coarse:h-11"
          />
          {pending ? (
            <Loader2Icon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" />
          ) : (
            <kbd className="data pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-border px-1.5 text-xs text-faint pointer-fine:block">
              /
            </kbd>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                control,
                contextFilters.length
                  ? "border-cabinet/60 text-foreground"
                  : "border-input text-muted-foreground hover:text-foreground",
              )}
            >
              <SlidersHorizontalIcon className="size-4" />
              Фильтры
              {contextFilters.length > 0 && <span className="data text-cabinet">{contextFilters.length}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-4">
            <FilterGroup label="Сколько есть времени">
              {TIME_FILTERS.map((o) => (
                <Chip key={o.value} active={filters.time === o.value} onClick={() => update({ time: filters.time === o.value ? null : o.value })}>
                  {o.label}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Где">
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
            <FilterGroup label="Деньги" last>
              {MONEY_FILTERS.map((o) => (
                <Chip key={o.value} active={filters.money === o.value} onClick={() => update({ money: filters.money === o.value ? null : o.value })}>
                  {o.label}
                </Chip>
              ))}
            </FilterGroup>
          </PopoverContent>
        </Popover>

        <Select value={filters.sort} onValueChange={(v) => update({ sort: v === "newest" ? null : v, seed: null })}>
          <SelectTrigger className="h-10! min-w-0 flex-1 gap-2 text-sm sm:w-auto sm:min-w-44 sm:flex-none pointer-coarse:h-11!" aria-label="Порядок">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          title="Перемешать — посмотреть на старые идеи свежим взглядом"
          onClick={() => update({ sort: "random", seed: String(newSeed()) })}
          className={cn(
            control,
            filters.sort === "random"
              ? "border-cabinet/60 text-foreground"
              : "border-input text-muted-foreground hover:text-foreground",
          )}
        >
          <DicesIcon className="size-4" />
          <span className="sr-only sm:not-sr-only">Перемешать</span>
        </button>
      </div>

      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        <Chip active={!filters.topic && !filters.favorites} onClick={() => update({ topic: null, fav: null })}>
          Все
        </Chip>
        <Chip active={filters.favorites} onClick={() => update({ fav: filters.favorites ? null : "1" })}>
          <StarIcon className={cn("size-3.5", filters.favorites && "fill-current text-cabinet")} />
          Со звездой
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
            aria-expanded={allTopics}
            className="min-h-8 shrink-0 px-2 text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
          >
            {allTopics ? "меньше" : `ещё ${topics.length - VISIBLE_TOPICS}`}
          </button>
        )}
      </div>

      {(contextFilters.length > 0 || anyFilter) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {contextFilters.map((f) => (
            <Chip key={f.key} active onClick={() => update({ [f.key]: null })} aria-label={`Убрать фильтр «${f.label}»`}>
              {f.label}
              <XIcon className="size-3.5" />
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => {
              setQ("")
              update({ q: null, topic: null, fav: null, time: null, location: null, money: null })
            }}
            className="inline-flex min-h-8 items-center gap-1 px-2 text-sm text-muted-foreground hover:text-foreground pointer-coarse:min-h-11"
          >
            <XIcon className="size-3.5" />
            Сбросить всё
          </button>
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <fieldset className={cn(!last && "mb-4")}>
      <legend className="mb-2 text-xs text-faint">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  )
}

function newSeed() {
  return Math.floor(Math.random() * 1_000_000) + 1
}
