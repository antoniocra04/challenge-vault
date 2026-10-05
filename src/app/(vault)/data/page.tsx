import type { Metadata } from "next"
import { DownloadIcon } from "lucide-react"
import { SectionLabel } from "@/components/challenge/meta"
import { ImportForm } from "@/components/data/import-form"
import { getStatusCounts } from "@/lib/challenges/queries"

export const metadata: Metadata = { title: "Your data" }

function ExportLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      download
      className="group flex items-start gap-4 rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-white/15 hover:bg-card"
    >
      <DownloadIcon className="mt-0.5 size-5 shrink-0 text-faint transition-colors group-hover:text-ember" />
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
      <h1 className="label-mono mb-3">Your data</h1>
      <p className="mb-10 text-muted-foreground">
        Everything lives on your own server — {total} {total === 1 ? "challenge" : "challenges"} right now. No telemetry,
        no cloud. Take it with you whenever you like.
      </p>

      <section className="mb-12">
        <SectionLabel>Export</SectionLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExportLink
            href="/api/export/json"
            title="JSON — full backup"
            description="Every challenge, log entry and attachment, with uploaded files embedded. Can be imported back."
          />
          <ExportLink
            href="/api/export/markdown"
            title="Markdown"
            description="A readable document of your whole vault. Good for archives and grepping."
          />
          <ExportLink
            href="/api/export/json?files=0"
            title="JSON — without files"
            description="Same as the full backup, minus uploaded file contents. Much smaller."
          />
        </div>
      </section>

      <section>
        <SectionLabel>Import</SectionLabel>
        <ImportForm />
      </section>
    </div>
  )
}
