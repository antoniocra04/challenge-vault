import Link from "next/link"
import { DatabaseIcon, LogOutIcon } from "lucide-react"
import { logout } from "@/app/actions"
import { CaptureButton } from "@/components/capture/capture-provider"
import { BottomNav, NavLinks } from "./nav-links"

const iconLink =
  "grid size-9 place-items-center rounded text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground pointer-coarse:size-11"

export function VaultHeader({ activeCount, authEnabled }: { activeCount: number; authEnabled: boolean }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        К содержимому
      </a>
      <header className="sticky top-0 z-40 border-b border-rule bg-shell">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="rounded text-[15px] font-semibold tracking-tight">
            Challenge Vault
          </Link>
          <NavLinks activeCount={activeCount} />
          <div className="ml-auto flex items-center gap-1">
            <Link href="/data" title="Экспорт и импорт" className={iconLink}>
              <DatabaseIcon className="size-4" />
              <span className="sr-only">Экспорт и импорт</span>
            </Link>
            {authEnabled && (
              <form action={logout}>
                <button type="submit" title="Выйти" className={iconLink}>
                  <LogOutIcon className="size-4" />
                  <span className="sr-only">Выйти</span>
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
