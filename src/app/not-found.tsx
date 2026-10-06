import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="data text-sm text-cabinet">№ 404</p>
        <h1 className="mt-3 text-2xl font-semibold">В хранилище такого нет</h1>
        <p className="mt-2 text-muted-foreground">Идеи не существует — или её удалили.</p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          В хранилище
        </Link>
      </div>
    </main>
  )
}
