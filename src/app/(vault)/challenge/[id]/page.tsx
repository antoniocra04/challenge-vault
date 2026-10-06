import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { DeleteChallengeButton, FavoriteButton } from "@/components/challenge/actions"
import { Field, Indicators, SectionHeading, TagList } from "@/components/challenge/meta"
import { StatusBadge } from "@/components/challenge/status-badge"
import { AttachmentsSection } from "@/components/detail/attachments-section"
import { DetailActions } from "@/components/detail/detail-actions"
import { EditChallenge } from "@/components/detail/edit-challenge"
import { LogSection } from "@/components/detail/log-section"
import { TimeSpentEditor } from "@/components/detail/time-spent-editor"
import { getBacklogTopics, getChallenge } from "@/lib/challenges/queries"
import { idSchema } from "@/lib/challenges/schemas"
import { accession, ago, longDate, shortDate } from "@/lib/dates"

async function load(id: string) {
  if (!idSchema.safeParse(id).success) return null
  return getChallenge(id)
}

export async function generateMetadata({ params }: PageProps<"/challenge/[id]">): Promise<Metadata> {
  const data = await load((await params).id)
  return { title: data?.challenge.title ?? "Не найдено" }
}

const BACK = {
  backlog: { href: "/", label: "В хранилище" },
  active: { href: "/active", label: "Сейчас" },
  completed: { href: "/completed", label: "В коллекцию" },
  abandoned: { href: "/archive", label: "В архив" },
} as const

export default async function ChallengePage({ params }: PageProps<"/challenge/[id]">) {
  const { id } = await params
  const [data, topics] = await Promise.all([load(id), getBacklogTopics()])
  if (!data) notFound()
  const { challenge: c, accession: no, log, attachments } = data
  const back = BACK[c.status]
  const notes = log.filter((e) => e.kind === "note").length

  return (
    <div>
      <Link
        href={back.href}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
      >
        <ArrowLeftIcon className="size-4" />
        {back.label}
      </Link>

      <div className="mt-4 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Order on phones: title, actions, content, details. */}
        <header className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="data text-sm text-cabinet">{accession(no)}</span>
            <StatusBadge status={c.status} />
            <FavoriteButton id={c.id} favorite={c.favorite} className="-ml-1" />
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{c.title}</h1>
          <TagList category={c.category} tags={c.tags} linkable className="mt-3 text-sm" />
        </header>

        <section aria-label="Действия" className="lg:col-start-2 lg:row-start-1 lg:self-end">
          <DetailActions challenge={c} accessionNo={no} />
        </section>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          {c.description && (
            <p className="max-w-[68ch] text-[17px] leading-relaxed whitespace-pre-line text-foreground/90">{c.description}</p>
          )}

          {c.spark && (
            <section className="mt-8 max-w-[68ch]" aria-labelledby="spark-heading">
              <h2 id="spark-heading" className="text-sm font-semibold text-muted-foreground">
                Искра
              </h2>
              <blockquote className="mt-2 text-[17px] leading-relaxed whitespace-pre-line text-foreground/90 italic">
                «{c.spark}»
              </blockquote>
            </section>
          )}

          {c.status === "completed" && (
            <section className="catalogued mt-8 max-w-[68ch] p-5" aria-labelledby="result-heading">
              <h2 id="result-heading" className="inline-flex items-center gap-2 text-sm font-semibold text-jade">
                Результат
              </h2>
              {c.result ? (
                <p className="mt-2 leading-relaxed whitespace-pre-line">{c.result}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Без описания. Сделать — уже результат.</p>
              )}
              {c.enjoymentScore != null && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Интерес <span className="data text-foreground">{c.enjoymentScore}/10</span>
                </p>
              )}
            </section>
          )}

          <section className="mt-10 max-w-[68ch]" aria-labelledby="log-heading">
            <SectionHeading id="log-heading" count={notes || undefined}>
              Журнал
            </SectionHeading>
            <LogSection challengeId={c.id} entries={log} />
          </section>
        </div>

        <aside className="grid content-start gap-10 lg:col-start-2 lg:row-start-2">
          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="mb-3 text-sm font-semibold">
              Паспорт
            </h2>
            <dl className="specimen grid gap-3 p-4">
              <Field label="Поймана">
                <span title={longDate(c.createdAt)}>
                  <span className="data">{shortDate(c.createdAt)}</span>{" "}
                  <span className="text-muted-foreground">· {ago(c.createdAt)}</span>
                </span>
              </Field>
              {c.startedAt && (
                <Field label="Начата">
                  <span className="data">{shortDate(c.startedAt)}</span>
                </Field>
              )}
              {c.completedAt && (
                <Field label="Завершена">
                  <span className="data">{shortDate(c.completedAt)}</span>
                </Field>
              )}
              {c.abandonedAt && (
                <Field label="Отпущена">
                  <span className="data">{shortDate(c.abandonedAt)}</span>
                  {c.abandonReason && <span className="text-muted-foreground"> · {c.abandonReason}</span>}
                </Field>
              )}
              {(c.status !== "backlog" || c.trackedSeconds > 0) && (
                <Field label="Потрачено">
                  <TimeSpentEditor
                    id={c.id}
                    trackedSeconds={c.trackedSeconds}
                    sessionStartedAt={c.sessionStartedAt}
                    actualDuration={c.status === "completed" ? c.actualDuration : null}
                  />
                </Field>
              )}
              {(c.estimatedDuration != null || c.requiresLeavingHome != null || c.requiresMoney != null) && (
                <Field label="Условия" className="border-t border-rule pt-3">
                  <Indicators
                    estimatedDuration={c.estimatedDuration}
                    requiresLeavingHome={c.requiresLeavingHome}
                    requiresMoney={c.requiresMoney}
                    className="text-sm text-foreground"
                  />
                  {c.requiresMoney === false && <span className="text-sm text-muted-foreground">бесплатно</span>}
                </Field>
              )}
            </dl>
          </section>

          <section aria-labelledby="attachments-heading">
            <h2 id="attachments-heading" className="mb-3 text-sm font-semibold">
              Вложения {attachments.length > 0 && <span className="data font-normal text-faint">{attachments.length}</span>}
            </h2>
            <AttachmentsSection challengeId={c.id} items={attachments} />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-4">
            <EditChallenge challenge={c} tagSuggestions={topics.map((t) => t.label)} />
            <DeleteChallengeButton id={c.id} title={c.title} />
          </div>
        </aside>
      </div>
    </div>
  )
}
