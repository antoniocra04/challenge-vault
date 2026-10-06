import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { DeleteChallengeButton, FavoriteButton } from "@/components/challenge/actions"
import { MarkerCircle } from "@/components/challenge/marker-circle"
import { Field, MetaLine, SectionHeading, TagList } from "@/components/challenge/meta"
import { StatusBadge } from "@/components/challenge/status-badge"
import { AttachmentsSection } from "@/components/detail/attachments-section"
import { DetailActions } from "@/components/detail/detail-actions"
import { EditChallenge } from "@/components/detail/edit-challenge"
import { LogSection } from "@/components/detail/log-section"
import { TimeSpentEditor } from "@/components/detail/time-spent-editor"
import { getBacklogTopics, getChallenge } from "@/lib/challenges/queries"
import { idSchema } from "@/lib/challenges/schemas"
import { ago, longDate, shortDate } from "@/lib/dates"

async function load(id: string) {
  if (!idSchema.safeParse(id).success) return null
  return getChallenge(id)
}

export async function generateMetadata({ params }: PageProps<"/challenge/[id]">): Promise<Metadata> {
  const data = await load((await params).id)
  return { title: data?.challenge.title ?? "Не найдено" }
}

const BACK = {
  backlog: { href: "/", label: "Идеи" },
  active: { href: "/active", label: "В работе" },
  completed: { href: "/completed", label: "Сделано" },
  abandoned: { href: "/archive", label: "Архив" },
} as const

export default async function ChallengePage({ params }: PageProps<"/challenge/[id]">) {
  const { id } = await params
  const [data, topics] = await Promise.all([load(id), getBacklogTopics()])
  if (!data) notFound()
  const { challenge: c, log, attachments } = data
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

      {/* Two independent columns on desktop; on phones the order is title, actions, content, details. */}
      <div className="mt-4 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-x-12">
        <div className="contents lg:block lg:min-w-0">
        <header className="order-1 min-w-0">
          <div className="flex items-start gap-3">
          <h1 className="mt-2 min-w-0 flex-1 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {c.status === "active" ? (
              <span className="relative inline-block">
                <MarkerCircle seed={c.id} pad={10} />
                <span className="relative">{c.title}</span>
              </span>
            ) : (
              c.title
            )}
          </h1>
            <FavoriteButton id={c.id} favorite={c.favorite} className="mt-2 shrink-0" />
          </div>
          <TagList category={c.category} tags={c.tags} linkable className="mt-3 text-sm" />
        </header>

        <div className="order-3 min-w-0 lg:mt-8">
          {c.description && (
            <p className="max-w-[68ch] text-[17px] leading-relaxed whitespace-pre-line text-foreground/90">{c.description}</p>
          )}

          {c.spark && (
            <section className="mt-8 max-w-[68ch]" aria-labelledby="spark-heading">
              <h2 id="spark-heading" className="text-sm font-semibold text-muted-foreground">
                Почему захотелось
              </h2>
              <p className="mt-2 text-[17px] leading-relaxed whitespace-pre-line">{c.spark}</p>
            </section>
          )}

          {c.status === "completed" && (
            <section className="print mt-8 max-w-[68ch] p-5" aria-labelledby="result-heading">
              <h2 id="result-heading" className="text-sm font-semibold">
                Результат
              </h2>
              {c.result ? (
                <p className="mt-2 leading-relaxed whitespace-pre-line">{c.result}</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Не описан.</p>
              )}
              {c.enjoymentScore != null && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Понравилось на <span className="data text-foreground">{c.enjoymentScore} из 10</span>
                </p>
              )}
            </section>
          )}

          <section className="mt-10 max-w-[68ch]" aria-labelledby="log-heading">
            <SectionHeading id="log-heading" count={notes || undefined}>
              Заметки
            </SectionHeading>
            <LogSection challengeId={c.id} entries={log} />
          </section>
        </div>

        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-10">
        <section aria-label="Действия" className="order-2">
          <DetailActions challenge={c} />
        </section>

        <aside className="order-4 grid content-start gap-10">
          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="mb-3 text-sm font-semibold">
              Детали
            </h2>
            <dl className="frame grid gap-3 p-4">
              <Field label="Статус">
                <StatusBadge status={c.status} />
              </Field>
              <Field label="Добавлена">
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
                <Field label="В архиве с">
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
                <Field label="Условия">
                  <MetaLine
                    estimatedDuration={c.estimatedDuration}
                    requiresLeavingHome={c.requiresLeavingHome}
                    requiresMoney={c.requiresMoney}
                    className="text-sm text-foreground"
                  />
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
    </div>
  )
}
