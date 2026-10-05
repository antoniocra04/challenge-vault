import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FavoriteButton, DeleteChallengeButton } from "@/components/challenge/actions"
import { SectionLabel, TagList } from "@/components/challenge/meta"
import { StatusBadge } from "@/components/challenge/status-badge"
import { AttachmentsSection } from "@/components/detail/attachments-section"
import { DetailActions } from "@/components/detail/detail-actions"
import { EditChallenge } from "@/components/detail/edit-challenge"
import { LogSection } from "@/components/detail/log-section"
import { TimeSpentEditor } from "@/components/detail/time-spent-editor"
import { getBacklogTopics, getChallenge } from "@/lib/challenges/queries"
import { idSchema } from "@/lib/challenges/schemas"
import { ago, longDate, shortDate } from "@/lib/dates"
import { formatEstimate } from "@/lib/duration"

async function load(id: string) {
  if (!idSchema.safeParse(id).success) return null
  return getChallenge(id)
}

export async function generateMetadata({ params }: PageProps<"/challenge/[id]">): Promise<Metadata> {
  const data = await load((await params).id)
  return { title: data?.challenge.title ?? "Not found" }
}

export default async function ChallengePage({ params }: PageProps<"/challenge/[id]">) {
  const { id } = await params
  const [data, topics] = await Promise.all([load(id), getBacklogTopics()])
  if (!data) notFound()
  const { challenge: c, log, attachments } = data
  const back =
    c.status === "completed" ? "/completed" : c.status === "abandoned" ? "/archive" : c.status === "active" ? "/active" : "/"
  const backLabel =
    c.status === "completed" ? "Completed" : c.status === "abandoned" ? "Archive" : c.status === "active" ? "Active" : "Vault"

  const details: [string, React.ReactNode][] = [
    ["Captured", <span key="c" title={longDate(c.createdAt)}>{shortDate(c.createdAt)} <span className="text-faint">· {ago(c.createdAt)}</span></span>],
  ]
  if (c.startedAt) details.push(["Started", shortDate(c.startedAt)])
  if (c.completedAt) details.push(["Completed", shortDate(c.completedAt)])
  if (c.abandonedAt) details.push(["Set aside", shortDate(c.abandonedAt)])
  if (c.abandonReason) details.push(["Why", c.abandonReason])
  if (c.estimatedDuration != null) details.push(["Estimate", <span key="e" className="font-mono">{formatEstimate(c.estimatedDuration)}</span>])
  if (c.status !== "backlog" || c.trackedSeconds > 0)
    details.push([
      "Time spent",
      <TimeSpentEditor
        key="t"
        id={c.id}
        trackedSeconds={c.trackedSeconds}
        sessionStartedAt={c.sessionStartedAt}
        actualDuration={c.status === "completed" ? c.actualDuration : null}
      />,
    ])
  if (c.requiresLeavingHome != null) details.push(["Where", c.requiresLeavingHome ? "🚶 Outside" : "🏠 Home"])
  if (c.requiresMoney != null) details.push(["Money", c.requiresMoney ? "💰 Requires money" : "Free"])

  return (
    <div>
      <Link
        href={back}
        className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        ← Back to {backLabel}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={c.status} />
            {c.status === "active" && <span className="ember-dot size-2 rounded-full bg-ember" />}
            <FavoriteButton id={c.id} favorite={c.favorite} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{c.title}</h1>
          <TagList category={c.category} tags={c.tags} linkable className="mt-4 text-xs" />

          {c.description && (
            <p className="mt-6 max-w-2xl text-[17px] leading-relaxed whitespace-pre-line text-foreground/85">
              {c.description}
            </p>
          )}

          {c.spark && (
            <section className="mt-10 max-w-2xl">
              <SectionLabel>Spark</SectionLabel>
              <blockquote className="border-l-2 border-ember/50 pl-5 text-[17px] leading-relaxed whitespace-pre-line text-foreground/90 italic">
                “{c.spark}”
              </blockquote>
            </section>
          )}

          {c.status === "completed" && (
            <section className="artifact-card mt-10 max-w-2xl rounded-2xl border border-jade/20 p-6">
              <div className="label-mono mb-3 text-jade">✓ Result</div>
              {c.result ? (
                <p className="leading-relaxed whitespace-pre-line">{c.result}</p>
              ) : (
                <p className="text-sm text-faint">No write-up. Doing it was the point.</p>
              )}
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm">
                {c.enjoymentScore != null && (
                  <span>
                    <span className="label-mono mr-2 text-[10px]">Enjoyment</span>
                    {c.enjoymentScore}/10
                  </span>
                )}
              </div>
            </section>
          )}

          <section className="mt-12 max-w-2xl">
            <SectionLabel count={log.filter((e) => e.kind === "note").length || undefined}>Log</SectionLabel>
            <LogSection challengeId={c.id} entries={log} canAdd />
          </section>
        </div>

        <aside className="grid content-start gap-10">
          <section>
            <SectionLabel>{c.status === "active" ? "Exploring" : "Actions"}</SectionLabel>
            <DetailActions challenge={c} />
          </section>

          <section>
            <SectionLabel>Details</SectionLabel>
            <dl className="grid gap-2.5 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3">
                  <dt className="label-mono text-[10px]">{label}</dt>
                  <dd className="min-w-0">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <SectionLabel count={attachments.length || undefined}>Attachments</SectionLabel>
            <AttachmentsSection challengeId={c.id} items={attachments} />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-4">
            <EditChallenge challenge={c} tagSuggestions={topics.map((t) => t.label)} />
            <DeleteChallengeButton id={c.id} title={c.title} />
          </div>
        </aside>
      </div>
    </div>
  )
}
