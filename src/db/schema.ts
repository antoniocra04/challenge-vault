import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const CHALLENGE_STATUSES = ["backlog", "active", "completed", "abandoned"] as const
export const LOG_ENTRY_KINDS = ["note", "event"] as const
export const ATTACHMENT_KINDS = ["image", "url", "text", "audio", "file"] as const

export const challengeStatus = pgEnum("challenge_status", CHALLENGE_STATUSES)
export const logEntryKind = pgEnum("log_entry_kind", LOG_ENTRY_KINDS)
export const attachmentKind = pgEnum("attachment_kind", ATTACHMENT_KINDS)

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" })

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    // Why this seemed interesting in the first place.
    spark: text("spark"),
    category: text("category"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: challengeStatus("status").notNull().default("backlog"),
    // "I especially want to try this someday". Not a priority.
    favorite: boolean("favorite").notNull().default(false),

    estimatedDuration: integer("estimated_duration"), // minutes
    actualDuration: integer("actual_duration"), // minutes, set on completion

    requiresLeavingHome: boolean("requires_leaving_home"),
    requiresMoney: boolean("requires_money"),

    result: text("result"),
    enjoymentScore: integer("enjoyment_score"), // 1-10
    abandonReason: text("abandon_reason"),

    // Time tracking: seconds accumulated over closed sessions plus the
    // start of the currently running session (only while active).
    trackedSeconds: integer("tracked_seconds").notNull().default(0),
    sessionStartedAt: timestamptz("session_started_at"),

    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow(),
    startedAt: timestamptz("started_at"),
    completedAt: timestamptz("completed_at"),
    abandonedAt: timestamptz("abandoned_at"),
  },
  (t) => [
    index("challenges_status_idx").on(t.status),
    index("challenges_created_at_idx").on(t.createdAt),
  ],
)

export const challengeLogEntries = pgTable(
  "challenge_log_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    // "note" is written by the user, "event" is a lifecycle marker
    // (started, returned to vault, ...).
    kind: logEntryKind("kind").notNull().default("note"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("challenge_log_entries_challenge_idx").on(t.challengeId, t.createdAt)],
)

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    kind: attachmentKind("kind").notNull(),
    title: text("title"),
    url: text("url"), // kind = url
    content: text("content"), // kind = text
    // Uploaded files (image / audio / file)
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    size: integer("size"),
    storageKey: text("storage_key"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("attachments_challenge_idx").on(t.challengeId)],
)

export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number]
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number]
export type Challenge = typeof challenges.$inferSelect
export type NewChallenge = typeof challenges.$inferInsert
export type ChallengeLogEntry = typeof challengeLogEntries.$inferSelect
export type Attachment = typeof attachments.$inferSelect
