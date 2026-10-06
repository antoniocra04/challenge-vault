import Link from "next/link"
import { DatabaseIcon, LogOutIcon } from "lucide-react"
import { logout } from "@/app/actions"
import { CaptureButton } from "@/components/capture/capture-provider"
import { BottomNav, NavLinks } from "./nav-links"

const iconLink =
  "grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:size-11"

export function VaultHeader({ activeCount, authEnabled }: { activeCount: number; authEnabled: boolean }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        К содержимому
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-shell/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-md">
            <VaultMark />
            <span className="text-[15px] font-semibold tracking-tight">Challenge Vault</span>
          </Link>
          <NavLinks activeCount={activeCount} />
          <div className="ml-auto flex items-center gap-1">
            <Link href="/data" title="Экспорт и импорт" className={iconLink}>
              <DatabaseIcon className="size-4" />
              <span className="sr-only">Экспорт и импорт</span>
            </Link>
            {authEnabled && (
              <form action={logout}>
                <button type="submit" title="Закрыть хранилище" className={iconLink}>
                  <LogOutIcon className="size-4" />
                  <span className="sr-only">Закрыть хранилище</span>
                </button>
              </form>
            )}
            <CaptureButton className="ml-2 hidden md:inline-flex" />
          </div>
        </div>
      </header>
      <BottomNav activeCount={activeCount} />
    </>
  )
}

function VaultMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
      <rect x="4" y="4" width="24" height="24" rx="5" fill="none" stroke="var(--cabinet)" strokeWidth="2" />
      <circle cx="16" cy="16" r="5.5" fill="none" stroke="var(--ember)" strokeWidth="2" />
      <path d="M16 10.5v-2M16 23.5v-2M10.5 16h-2M23.5 16h-2" stroke="var(--ember)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
