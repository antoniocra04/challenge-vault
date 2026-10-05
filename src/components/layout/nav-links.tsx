"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function NavLinks({ activeCount }: { activeCount: number }) {
  const pathname = usePathname()
  const links = [
    { href: "/", label: "Vault", match: (p: string) => p === "/" },
    { href: "/active", label: "Active", match: (p: string) => p.startsWith("/active"), count: activeCount },
    { href: "/completed", label: "Completed", match: (p: string) => p.startsWith("/completed") },
    { href: "/archive", label: "Archive", match: (p: string) => p.startsWith("/archive") },
  ]
  return (
    <nav className="-mx-1 flex items-center gap-0.5 overflow-x-auto">
      {links.map((l) => {
        const active = l.match(pathname)
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-2.5 py-1.5 font-mono text-[11px] font-medium tracking-[0.16em] whitespace-nowrap uppercase transition-colors",
              active ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
            {l.count ? (
              <span className="ml-1.5 inline-flex items-center gap-1 text-ember">
                <span className="ember-dot size-1.5 rounded-full bg-ember" />
                {l.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
