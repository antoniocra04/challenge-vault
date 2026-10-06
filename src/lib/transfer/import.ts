import { inArray, sql } from "drizzle-orm"
import { db } from "@/db"
import { attachments, challengeLogEntries, challenges } from "@/db/schema"
import { parseTags } from "@/lib/challenges/filters"
import { VaultError } from "@/lib/challenges/errors"
import {
  deleteStoredFiles,
  newStorageKey,
  storedFileExists,
  writeStoredFile,
} from "@/lib/storage"
import { importFileSchema, type ImportFile } from "./format"

export type ImportMode = "merge" | "replace"

export type ImportResult = {
  challenges: number
  logEntries: number
  attachments: number
  files: number
}

export function parseImport(json: unknown): ImportFile {
  // Also accept a bare array of challenges for hand-written files.
  const candidate = Array.isArray(json) ? { challenges: json } : json
  const parsed = importFileSchema.safeParse(candidate)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue.path.length ? ` (at ${issue.path.join(".")})` : ""
    throw new VaultError(`Файл не похож на экспорт Challenge Vault: ${issue.message}${where}`)
  }
  return parsed.data
}

export async function importVault(file: ImportFile, mode: ImportMode): Promise<ImportResult> {
  const result: ImportResult = { challenges: 0, logEntries: 0, attachments: 0, files: 0 }
  const writtenKeys: string[] = []

  // 1. Prepare rows and write uploaded files first (outside the transaction).
  const challengeRows: (typeof challenges.$inferInsert)[] = []
  const logRows: (typeof challengeLogEntries.$inferInsert)[] = []
  const attachmentRows: (typeof attachments.$inferInsert)[] = []

  try {
    for (const c of file.challenges) {
      const id = c.id ?? crypto.randomUUID()
      const createdAt = c.createdAt ?? new Date()
      challengeRows.push({
        id,
        title: c.title,
        description: c.description,
        spark: c.spark,
        category: c.category,
        tags: parseTags(c.tags),
        status: c.status,
        favorite: c.favorite,
        estimatedDuration: c.estimatedDuration,
        actualDuration: c.actualDuration,
        requiresLeavingHome: c.requiresLeavingHome,
        requiresMoney: c.requiresMoney,
        result: c.result,
        enjoymentScore: c.enjoymentScore,
        abandonReason: c.abandonReason,
        trackedSeconds: c.trackedSeconds,
        sessionStartedAt: c.status === "active" ? c.sessionStartedAt : null,
        createdAt,
        updatedAt: c.updatedAt ?? createdAt,
        startedAt: c.startedAt,
        completedAt: c.completedAt,
        abandonedAt: c.abandonedAt,
      })
      for (const e of c.log) {
        logRows.push({
          id: e.id ?? crypto.randomUUID(),
          challengeId: id,
          content: e.content,
          kind: e.kind,
          createdAt: e.createdAt ?? createdAt,
        })
      }
      for (const a of c.attachments) {
        let storageKey: string | null = null
        if (a.data) {
          storageKey = newStorageKey()
          await writeStoredFile(storageKey, Buffer.from(a.data, "base64"))
          writtenKeys.push(storageKey)
          result.files++
        } else if (a.storageKey && /^[a-zA-Z0-9-]{8,64}$/.test(a.storageKey) && (await storedFileExists(a.storageKey))) {
          storageKey = a.storageKey
        }
        attachmentRows.push({
          id: a.id ?? crypto.randomUUID(),
          challengeId: id,
          kind: a.kind,
          title: a.title,
          url: a.url,
          content: a.content,
          fileName: a.fileName,
          mimeType: a.mimeType,
          size: a.size,
          storageKey,
          createdAt: a.createdAt ?? createdAt,
        })
      }
    }
  } catch (err) {
    await deleteStoredFiles(writtenKeys)
    throw err
  }

  // 2. Write everything atomically.
  let replacedKeys: string[] = []
  try {
    replacedKeys = await db.transaction(async (tx) => {
      const ids = challengeRows.map((c) => c.id!)
      const scope = mode === "replace" ? undefined : ids.length ? inArray(attachments.challengeId, ids) : sql`false`
      const old = await tx.select({ key: attachments.storageKey }).from(attachments).where(scope)

      if (mode === "replace") {
        await tx.delete(challenges)
      } else if (ids.length) {
        // Imported challenges replace their previous version entirely.
        await tx.delete(challengeLogEntries).where(inArray(challengeLogEntries.challengeId, ids))
        await tx.delete(attachments).where(inArray(attachments.challengeId, ids))
      }

      for (const batch of chunks(challengeRows, 200)) {
        await tx
          .insert(challenges)
          .values(batch)
          .onConflictDoUpdate({
            target: challenges.id,
            set: Object.fromEntries(
              Object.keys(batch[0])
                .filter((k) => k !== "id")
                .map((k) => [k, sql.raw(`excluded."${snake(k)}"`)]),
            ),
          })
      }
      for (const batch of chunks(logRows, 500)) {
        await tx.insert(challengeLogEntries).values(batch).onConflictDoNothing()
      }
      for (const batch of chunks(attachmentRows, 500)) {
        await tx.insert(attachments).values(batch).onConflictDoNothing()
      }
      return old.map((o) => o.key).filter((k): k is string => Boolean(k))
    })
  } catch (err) {
    await deleteStoredFiles(writtenKeys)
    throw err
  }

  // 3. Clean up files that are no longer referenced.
  const kept = new Set(attachmentRows.map((a) => a.storageKey).filter(Boolean))
  await deleteStoredFiles(replacedKeys.filter((k) => !kept.has(k)))

  result.challenges = challengeRows.length
  result.logEntries = logRows.length
  result.attachments = attachmentRows.length
  return result
}

function snake(key: string) {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function* chunks<T>(items: T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size)
}
