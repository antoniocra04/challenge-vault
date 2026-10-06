"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArchiveIcon, FlaskConicalIcon, LibraryIcon, VaultIcon } from "lucide-react"
import { CaptureButton } from "@/components/capture/capture-provider"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Хранилище", icon: VaultIcon, match: (p: string) => p === "/" },
  { href: "/active", label: "Сейчас", icon: FlaskConicalIcon, match: (p: string) => p.startsWith("/active"), counted: true },
  { href: "/completed", label: "Коллекция", icon: LibraryIcon, match: (p: string) => p.startsWith("/completed") },
  { href: "/archive", label: "Архив", icon: ArchiveIcon, match: (p: string) => p.startsWith("/archive") },
] as const

function ActiveCount({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="inline-flex items-center gap-1 text-ember">
      <span className="ember-dot size-1.5 rounded-full bg-ember" aria-hidden />
      <span className="data text-xs">{count}</span>
      <span className="sr-only">в работе</span>
    </span>
  )
}

/** Desktop navigation in the header. */
export function NavLinks({ activeCount }: { activeCount: number }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Разделы" className="hidden items-center gap-1 md:flex">
      {LINKS.map((l) => {
        const active = l.match(pathname)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
              active ? "bg-white/[0.07] text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
            {"counted" in l && <ActiveCount count={activeCount} />}
          </Link>
        )
      })}
    </nav>
  )
}

/** Mobile navigation: a bottom bar in thumb reach, capture in the middle. */
export function BottomNav({ activeCount }: { activeCount: number }) {
  const pathname = usePathname()
  const item = (l: (typeof LINKS)[number]) => {
    const active = l.match(pathname)
    const Icon = l.icon
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[12px] font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span className="relative">
          <Icon className={cn("size-5", active && "text-cabinet")} />
          {"counted" in l && activeCount > 0 && (
            <span className="ember-dot absolute -top-0.5 -right-1.5 size-2 rounded-full bg-ember" aria-hidden />
          )}
        </span>
        {l.label}
        {"counted" in l && activeCount > 0 && <span className="sr-only">, в работе: {activeCount}</span>}
      </Link>
    )
  }
  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-shell/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        {item(LINKS[0])}
        {item(LINKS[1])}
        <div className="flex flex-1 items-center justify-center">
          <CaptureButton compact />
        </div>
        {item(LINKS[2])}
        {item(LINKS[3])}
      </div>
    </nav>
  )
}
