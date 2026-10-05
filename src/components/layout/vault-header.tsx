import Link from "next/link"
import { DatabaseIcon, LogOutIcon } from "lucide-react"
import { logout } from "@/app/actions"
import { CaptureButton } from "@/components/capture/capture-provider"
import { NavLinks } from "./nav-links"

export function VaultHeader({ activeCount, authEnabled }: { activeCount: number; authEnabled: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <VaultMark />
          <span className="font-mono text-[13px] font-semibold tracking-[0.24em] uppercase">
            Challenge <span className="text-ember transition-colors group-hover:text-foreground">Vault</span>
          </span>
        </Link>
        <div className="order-3 w-full sm:order-none sm:w-auto">
          <NavLinks activeCount={activeCount} />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/data"
            title="Export / import"
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <DatabaseIcon className="size-4" />
            <span className="sr-only">Export / import</span>
          </Link>
          {authEnabled && (
            <form action={logout}>
              <button
                type="submit"
                title="Lock the vault"
                className="grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <LogOutIcon className="size-4" />
                <span className="sr-only">Lock the vault</span>
              </button>
            </form>
          )}
          <CaptureButton className="ml-2" />
        </div>
      </div>
    </header>
  )
}

function VaultMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
      <circle cx="16" cy="16" r="10" fill="none" stroke="var(--ember)" strokeWidth="2" />
      <circle cx="16" cy="16" r="3" fill="var(--ember)" />
      <path d="M16 6v3M16 23v3M6 16h3M23 16h3" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
