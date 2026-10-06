import type { Metadata } from "next"
import { DownloadIcon } from "lucide-react"
import { SectionHeading } from "@/components/challenge/meta"
import { ImportForm } from "@/components/data/import-form"
import { getStatusCounts } from "@/lib/challenges/queries"

export const metadata: Metadata = { title: "Данные" }

function ExportRow({ href, title, description, format }: { href: string; title: string; description: string; format: string }) {
  return (
    <li>
      <a
        href={href}
        download
        className="group grid min-h-14 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-0.5 px-4 py-3 transition-colors hover:bg-label-hi sm:grid-cols-[9rem_1fr_auto]"
      >
        <span className="font-medium">{title}</span>
        <span className="col-start-1 row-start-2 text-sm text-muted-foreground sm:col-start-2 sm:row-start-1">{description}</span>
        <span className="col-start-2 row-span-2 row-start-1 inline-flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground sm:col-start-3 sm:row-span-1">
          <span className="text-xs">{format}</span>
          <DownloadIcon className="size-4" />
        </span>
      </a>
    </li>
  )
}

export default async function DataPage() {
  const counts = await getStatusCounts()
  const total = counts.backlog + counts.active + counts.completed + counts.abandoned
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Данные</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Всего идей: <span className="data">{total}</span>. Данные хранятся только на этом сервере.
      </p>

      <section className="mb-10" aria-labelledby="export-heading">
        <SectionHeading id="export-heading">Экспорт</SectionHeading>
        <ul className="frame divide-y divide-rule">
          <ExportRow
            href="/api/export/json"
            title="Полная копия"
            format=".json"
            description="Идеи, заметки и вложения вместе с файлами. Подходит для восстановления."
          />
          <ExportRow href="/api/export/json?files=0" title="Без файлов" format=".json" description="То же, но без содержимого файлов." />
          <ExportRow href="/api/export/markdown" title="Markdown" format=".md" description="Всё в виде текстового документа." />
        </ul>
      </section>

      <section aria-labelledby="import-heading">
        <SectionHeading id="import-heading">Импорт</SectionHeading>
        <ImportForm />
      </section>
    </div>
  )
}
