import type { Metadata } from "next"
import { DownloadIcon } from "lucide-react"
import { SectionHeading } from "@/components/challenge/meta"
import { ImportForm } from "@/components/data/import-form"
import { getStatusCounts } from "@/lib/challenges/queries"
import { plural } from "@/lib/plural"

export const metadata: Metadata = { title: "Данные" }

function ExportRow({ href, title, description, format }: { href: string; title: string; description: string; format: string }) {
  return (
    <li>
      <a
        href={href}
        download
        className="group grid min-h-16 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-0.5 px-4 py-3 transition-colors hover:bg-white/[0.04] sm:grid-cols-[10rem_1fr_auto]"
      >
        <span className="font-medium">{title}</span>
        <span className="col-start-1 row-start-2 text-sm text-muted-foreground sm:col-start-2 sm:row-start-1">{description}</span>
        <span className="col-start-2 row-span-2 row-start-1 inline-flex items-center gap-2 text-sm text-muted-foreground group-hover:text-cabinet sm:col-start-3 sm:row-span-1">
          <span className="data text-xs">{format}</span>
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
      <p className="mt-2 mb-10 text-muted-foreground">
        Всё хранится на твоём сервере — сейчас это <span className="data text-foreground">{total}</span>{" "}
        {plural(total, "идея", "идеи", "идей")}. Без телеметрии и облаков. Забрать можно в любой момент.
      </p>

      <section className="mb-12" aria-labelledby="export-heading">
        <SectionHeading id="export-heading">Экспорт</SectionHeading>
        <ul className="specimen divide-y divide-rule">
          <ExportRow
            href="/api/export/json"
            title="Полная копия"
            format=".json"
            description="Все идеи, журналы и вложения вместе с файлами. Можно импортировать обратно."
          />
          <ExportRow
            href="/api/export/json?files=0"
            title="Без файлов"
            format=".json"
            description="То же самое, но без содержимого загруженных файлов. Намного меньше."
          />
          <ExportRow
            href="/api/export/markdown"
            title="Читаемый документ"
            format=".md"
            description="Всё хранилище одним Markdown-файлом. Удобно для архива и поиска."
          />
        </ul>
      </section>

      <section aria-labelledby="import-heading">
        <SectionHeading id="import-heading">Импорт</SectionHeading>
        <ImportForm />
      </section>
    </div>
  )
}
