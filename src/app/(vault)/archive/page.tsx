import type { Metadata } from "next"
import Link from "next/link"
import { RestoreButton } from "@/components/challenge/actions"
import { SectionHeading } from "@/components/challenge/meta"
import { getChallengesByStatus } from "@/lib/challenges/queries"
import { accession, shortDate } from "@/lib/dates"
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
      <p className="-mt-2 mb-8 max-w-xl text-muted-foreground">
        Идеи, которые отжили своё. Потерять интерес — не провал: значит, нужное уже понятно или нашлось что-то
        интереснее.
      </p>
      {items.length === 0 ? (
        <div className="specimen border-dashed px-6 py-14 text-center text-muted-foreground">Пока ничего не отпущено.</div>
      ) : (
        <ul className="specimen divide-y divide-rule">
          {items.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-5">
              <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="data shrink-0 text-xs whitespace-nowrap text-faint">{accession(c.accession)}</span>
                  <Link href={`/challenge/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                    {c.title}
                  </Link>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[
                    `отпущена ${shortDate(c.abandonedAt)}`,
                    c.abandonReason,
                    c.trackedSeconds >= 60 ? `исследовалась ${formatSeconds(c.trackedSeconds)}` : null,
                    c.noteCount > 0 ? `${c.noteCount} ${plural(c.noteCount, "запись", "записи", "записей")} в журнале` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <RestoreButton id={c.id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
