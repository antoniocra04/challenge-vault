import { z } from "zod"
import { ATTACHMENT_KINDS, CHALLENGE_STATUSES, LOG_ENTRY_KINDS } from "@/db/schema"

export const EXPORT_FORMAT = "challenge-vault"
export const EXPORT_VERSION = 1

const date = z.coerce.date()
const nullableDate = z.union([z.null(), date]).optional().transform((v) => v ?? null)
const nullableString = z.string().nullish().transform((v) => (v == null || v === "" ? null : v))
const nullableInt = z.number().int().nullish().transform((v) => v ?? null)
const nullableBool = z.boolean().nullish().transform((v) => v ?? null)

const uuidLike = z
  .string()
  .optional()
  .transform((v) => (v && z.uuid().safeParse(v).success ? v.toLowerCase() : undefined))

export const importLogEntrySchema = z.object({
  id: uuidLike,
  content: z.string().min(1),
  kind: z.enum(LOG_ENTRY_KINDS).default("note"),
  createdAt: date.optional(),
})

export const importAttachmentSchema = z.object({
  id: uuidLike,
  kind: z.enum(ATTACHMENT_KINDS),
  title: nullableString,
  url: nullableString,
  content: nullableString,
  fileName: nullableString,
  mimeType: nullableString,
  size: nullableInt,
  storageKey: nullableString,
  createdAt: date.optional(),
  // Base64 file contents, present when the export included files.
  data: z.string().nullish(),
})

export const importChallengeSchema = z.object({
  id: uuidLike,
  title: z.string().trim().min(1),
  description: nullableString,
  spark: nullableString,
  category: nullableString,
  tags: z.array(z.string()).default([]),
  status: z.enum(CHALLENGE_STATUSES).default("backlog"),
  favorite: z.boolean().default(false),
  estimatedDuration: nullableInt,
  actualDuration: nullableInt,
  requiresLeavingHome: nullableBool,
  requiresMoney: nullableBool,
  result: nullableString,
  enjoymentScore: z.number().int().min(1).max(10).nullish().transform((v) => v ?? null),
  abandonReason: nullableString,
  trackedSeconds: z.number().int().min(0).default(0),
  sessionStartedAt: nullableDate,
  createdAt: date.optional(),
  updatedAt: date.optional(),
  startedAt: nullableDate,
  completedAt: nullableDate,
  abandonedAt: nullableDate,
  log: z.array(importLogEntrySchema).default([]),
  attachments: z.array(importAttachmentSchema).default([]),
})

export const importFileSchema = z.object({
  format: z.literal(EXPORT_FORMAT).optional(),
  version: z.number().int().max(EXPORT_VERSION, "Этот экспорт сделан более новой версией Challenge Vault").optional(),
  challenges: z.array(importChallengeSchema),
})

export type ImportFile = z.output<typeof importFileSchema>
export type ImportChallenge = z.output<typeof importChallengeSchema>
