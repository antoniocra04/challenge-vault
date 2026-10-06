import type { Metadata } from "next"
import Link from "next/link"
import { RestoreButton } from "@/components/challenge/actions"
import { SectionHeading } from "@/components/challenge/meta"
import { getChallengesByStatus } from "@/lib/challenges/queries"
import { shortDate } from "@/lib/dates"
import { formatSeconds } from "@/lib/duration"
import { plural } from "@/lib/plural"

export const metadata: Metadata = { title: "Архив" }

export default async function ArchivePage() {
  const items = await getChallengesByStatus("abandoned")
  return (
    <div>
      <SectionHeading as="h1" count={items.length}>
        Архив
      </SectionHeading>
      {items.length === 0 ? (
        <p className="frame px-6 py-14 text-center text-muted-foreground">Архив пуст.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((c) => (
            <li key={c.id} className="underexposed flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
              <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                <Link href={`/challenge/${c.id}`} className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {c.title}
                </Link>
                <p className="data mt-1 text-sm text-faint">
                  {[
                    `в архиве с ${shortDate(c.abandonedAt)}`,
                    c.abandonReason,
                    c.trackedSeconds >= 60 ? `потрачено ${formatSeconds(c.trackedSeconds)}` : null,
                    c.noteCount > 0 ? `${c.noteCount} ${plural(c.noteCount, "заметка", "заметки", "заметок")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <RestoreButton id={c.id} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
