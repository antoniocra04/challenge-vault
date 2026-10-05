import { and, asc, desc, eq, isNotNull, ne, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/db"
import {
  attachments,
  challengeLogEntries,
  challenges,
  type Challenge,
  type ChallengeStatus,
} from "@/db/schema"
import { seededShuffle, timeFilterRange, type BacklogFilters } from "./filters"

// Correlated subqueries are written with explicit, fully qualified names:
// drizzle renders column references in the select list unqualified, which
// would make "id" resolve to the inner table.
const noteCount = sql<number>`(
  select count(*)::int from challenge_log_entries l
  where l.challenge_id = "challenges"."id" and l.kind = 'note'
)`.as("note_count")

const attachmentCount = sql<number>`(
  select count(*)::int from attachments a
  where a.challenge_id = "challenges"."id"
)`.as("attachment_count")

const lastNote = sql<string | null>`(
  select l.content from challenge_log_entries l
  where l.challenge_id = "challenges"."id" and l.kind = 'note'
  order by l.created_at desc
  limit 1
)`.as("last_note")

export type ChallengeListItem = Challenge & {
  noteCount: number
  attachmentCount: number
}

export type ActiveChallenge = ChallengeListItem & { lastNote: string | null }

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/**
 * Full-text-ish search: every word must appear somewhere in the challenge —
 * title, description, spark, result, category, tags, log entries or
 * attachment titles / links / notes. ILIKE keeps it language-agnostic, which
 * matters for mixed Russian / English vaults.
 */
export function searchCondition(q: string): SQL | undefined {
  const terms = q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8)
  if (terms.length === 0) return undefined
  const perTerm = terms.map((term) => {
    const pattern = `%${escapeLike(term)}%`
    return or(
      sql`${challenges.title} ilike ${pattern}`,
      sql`${challenges.description} ilike ${pattern}`,
      sql`${challenges.spark} ilike ${pattern}`,
      sql`${challenges.result} ilike ${pattern}`,
      sql`${challenges.category} ilike ${pattern}`,
      sql`array_to_string(${challenges.tags}, ' ') ilike ${pattern}`,
      sql`exists (
        select 1 from challenge_log_entries l
        where l.challenge_id = "challenges"."id" and l.content ilike ${pattern}
      )`,
      sql`exists (
        select 1 from attachments a
        where a.challenge_id = "challenges"."id"
          and concat_ws(' ', a.title, a.url, a.content, a.file_name) ilike ${pattern}
      )`,
    )!
  })
  return and(...perTerm)
}

function topicCondition(topic: string): SQL {
  const t = topic.toLowerCase()
  return or(
    sql`lower(${challenges.category}) = ${t}`,
    sql`exists (select 1 from unnest(${challenges.tags}) as tag where lower(tag) = ${t})`,
  )!
}

function backlogConditions(f: BacklogFilters): SQL[] {
  const conds: SQL[] = [eq(challenges.status, "backlog")]
  const search = searchCondition(f.q)
  if (search) conds.push(search)
  if (f.topic) conds.push(topicCondition(f.topic))
  if (f.favorites) conds.push(eq(challenges.favorite, true))
  if (f.time) {
    const { min, max } = timeFilterRange(f.time)
    conds.push(isNotNull(challenges.estimatedDuration))
    if (min != null) conds.push(sql`${challenges.estimatedDuration} >= ${min}`)
    if (max != null) conds.push(sql`${challenges.estimatedDuration} <= ${max}`)
  }
  if (f.location === "outside") conds.push(eq(challenges.requiresLeavingHome, true))
  if (f.location === "home") conds.push(sql`${challenges.requiresLeavingHome} is not true`)
  if (f.money === "money") conds.push(eq(challenges.requiresMoney, true))
  if (f.money === "free") conds.push(sql`${challenges.requiresMoney} is not true`)
  return conds
}

export async function getBacklog(f: BacklogFilters): Promise<ChallengeListItem[]> {
  const order = (() => {
    switch (f.sort) {
      case "oldest":
        return [asc(challenges.createdAt)]
      case "updated":
        return [desc(challenges.updatedAt)]
      case "estimate":
        return [sql`${challenges.estimatedDuration} asc nulls last`, desc(challenges.createdAt)]
      default:
        return [desc(challenges.createdAt)]
    }
  })()

  const rows = await db
    .select({ ...challengeColumns(), noteCount, attachmentCount })
    .from(challenges)
    .where(and(...backlogConditions(f)))
    .orderBy(...order, asc(challenges.id))

  if (f.sort === "random") {
    return seededShuffle(
      [...rows].sort((a, b) => a.id.localeCompare(b.id)),
      f.seed,
    )
  }
  return rows
}

export async function countBacklog(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(challenges)
    .where(eq(challenges.status, "backlog"))
  return row?.n ?? 0
}

/** Matches outside the backlog, shown under the backlog while searching. */
export async function searchElsewhere(q: string): Promise<ChallengeListItem[]> {
  const search = searchCondition(q)
  if (!search) return []
  return db
    .select({ ...challengeColumns(), noteCount, attachmentCount })
    .from(challenges)
    .where(and(ne(challenges.status, "backlog"), search))
    .orderBy(desc(challenges.updatedAt))
    .limit(30)
}

export type Topic = { key: string; label: string; count: number }

/** Categories and tags present in the backlog, most common first. */
export async function getBacklogTopics(): Promise<Topic[]> {
  const rows = await db
    .select({ category: challenges.category, tags: challenges.tags })
    .from(challenges)
    .where(eq(challenges.status, "backlog"))
  const map = new Map<string, Topic>()
  const bump = (label: string) => {
    const key = label.toLowerCase()
    const existing = map.get(key)
    if (existing) existing.count++
    else map.set(key, { key, label, count: 1 })
  }
  for (const row of rows) {
    const seen = new Set<string>()
    for (const label of [row.category, ...row.tags]) {
      if (!label || seen.has(label.toLowerCase())) continue
      seen.add(label.toLowerCase())
      bump(label)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export async function getActiveChallenges(): Promise<ActiveChallenge[]> {
  return db
    .select({ ...challengeColumns(), noteCount, attachmentCount, lastNote })
    .from(challenges)
    .where(eq(challenges.status, "active"))
    .orderBy(desc(challenges.startedAt), asc(challenges.id))
}

export async function getChallengesByStatus(status: ChallengeStatus): Promise<ChallengeListItem[]> {
  const order =
    status === "completed"
      ? desc(challenges.completedAt)
      : status === "abandoned"
        ? desc(challenges.abandonedAt)
        : desc(challenges.createdAt)
  return db
    .select({ ...challengeColumns(), noteCount, attachmentCount })
    .from(challenges)
    .where(eq(challenges.status, status))
    .orderBy(order, asc(challenges.id))
}

export async function getChallenge(id: string) {
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1)
  if (!challenge) return null
  const [log, files] = await Promise.all([
    db
      .select()
      .from(challengeLogEntries)
      .where(eq(challengeLogEntries.challengeId, id))
      .orderBy(asc(challengeLogEntries.createdAt), asc(challengeLogEntries.id)),
    db
      .select()
      .from(attachments)
      .where(eq(attachments.challengeId, id))
      .orderBy(asc(attachments.createdAt), asc(attachments.id)),
  ])
  return { challenge, log, attachments: files }
}

export type ChallengeDetail = NonNullable<Awaited<ReturnType<typeof getChallenge>>>

export async function getStatusCounts(): Promise<Record<ChallengeStatus, number>> {
  const rows = await db
    .select({ status: challenges.status, n: sql<number>`count(*)::int` })
    .from(challenges)
    .groupBy(challenges.status)
  const counts: Record<ChallengeStatus, number> = { backlog: 0, active: 0, completed: 0, abandoned: 0 }
  for (const row of rows) counts[row.status] = row.n
  return counts
}

export async function getAllChallengesForStats() {
  return db
    .select({
      status: challenges.status,
      category: challenges.category,
      tags: challenges.tags,
      actualDuration: challenges.actualDuration,
      trackedSeconds: challenges.trackedSeconds,
      sessionStartedAt: challenges.sessionStartedAt,
      createdAt: challenges.createdAt,
      startedAt: challenges.startedAt,
      completedAt: challenges.completedAt,
    })
    .from(challenges)
}

function challengeColumns() {
  return {
    id: challenges.id,
    title: challenges.title,
    description: challenges.description,
    spark: challenges.spark,
    category: challenges.category,
    tags: challenges.tags,
    status: challenges.status,
    favorite: challenges.favorite,
    estimatedDuration: challenges.estimatedDuration,
    actualDuration: challenges.actualDuration,
    requiresLeavingHome: challenges.requiresLeavingHome,
    requiresMoney: challenges.requiresMoney,
    result: challenges.result,
    enjoymentScore: challenges.enjoymentScore,
    abandonReason: challenges.abandonReason,
    trackedSeconds: challenges.trackedSeconds,
    sessionStartedAt: challenges.sessionStartedAt,
    createdAt: challenges.createdAt,
    updatedAt: challenges.updatedAt,
    startedAt: challenges.startedAt,
    completedAt: challenges.completedAt,
    abandonedAt: challenges.abandonedAt,
  }
}
