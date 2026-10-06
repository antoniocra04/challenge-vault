import type { Metadata } from "next"
import { DownloadIcon } from "lucide-react"
import { SectionHeading } from "@/components/challenge/meta"
import { ImportForm } from "@/components/data/import-form"
import { getStatusCounts } from "@/lib/challenges/queries"
import { plural } from "@/lib/plural"

export const metadata: Metadata = { title: "Данные" }

function ExportLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      download
      className="specimen group flex items-start gap-4 p-5 transition-colors hover:border-white/20 hover:bg-label-hi"
    >
      <DownloadIcon className="mt-0.5 size-5 shrink-0 text-faint transition-colors group-hover:text-cabinet" />
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
      </span>
    </a>
  )
}

export default async function DataPage() {
  const counts = await getStatusCounts()
  const total = counts.backlog + counts.active + counts.completed + counts.abandoned
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Данные</h1>
      <p className="mt-2 mb-10 text-muted-foreground">
        Всё хранится на твоём сервере — сейчас это <span className="data text-foreground">{total}</span>{" "}
        {plural(total, "идея", "идеи", "идей")}. Без телеметрии и облаков. Забрать можно в любой момент.
      </p>

      <section className="mb-12" aria-labelledby="export-heading">
        <SectionHeading id="export-heading">Экспорт</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExportLink
            href="/api/export/json"
            title="JSON — полная копия"
            description="Все идеи, журналы и вложения вместе с загруженными файлами. Можно импортировать обратно."
          />
          <ExportLink
            href="/api/export/markdown"
            title="Markdown"
            description="Читаемый документ со всем хранилищем. Удобно для архива и поиска."
          />
          <ExportLink
            href="/api/export/json?files=0"
            title="JSON — без файлов"
            description="То же, что полная копия, но без содержимого файлов. Намного меньше."
          />
        </div>
      </section>

      <section aria-labelledby="import-heading">
        <SectionHeading id="import-heading">Импорт</SectionHeading>
        <ImportForm />
      </section>
    </div>
  )
}
