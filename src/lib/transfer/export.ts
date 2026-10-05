import { asc } from "drizzle-orm"
import { format } from "date-fns"
import { db } from "@/db"
import { attachments, challengeLogEntries, challenges, type Attachment, type ChallengeLogEntry } from "@/db/schema"
import { formatMinutes } from "@/lib/duration"
import { readStoredFile } from "@/lib/storage"
import { EXPORT_FORMAT, EXPORT_VERSION } from "./format"

export async function loadVault() {
  const [rows, log, files] = await Promise.all([
    db.select().from(challenges).orderBy(asc(challenges.createdAt), asc(challenges.id)),
    db.select().from(challengeLogEntries).orderBy(asc(challengeLogEntries.createdAt), asc(challengeLogEntries.id)),
    db.select().from(attachments).orderBy(asc(attachments.createdAt), asc(attachments.id)),
  ])
  const logBy = groupBy(log, (e) => e.challengeId)
  const filesBy = groupBy(files, (a) => a.challengeId)
  return rows.map((c) => ({ ...c, log: logBy.get(c.id) ?? [], attachments: filesBy.get(c.id) ?? [] }))
}

export type VaultSnapshot = Awaited<ReturnType<typeof loadVault>>

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

function stripLog({ id, content, kind, createdAt }: ChallengeLogEntry) {
  return { id, content, kind, createdAt }
}

export async function buildJsonExport(opts: { includeFiles: boolean }) {
  const vault = await loadVault()
  const out = []
  for (const c of vault) {
    const { log, attachments: files, ...challenge } = c
    const exportedFiles = []
    for (const a of files) {
      const { challengeId, ...rest } = a
      void challengeId
      let data: string | undefined
      if (opts.includeFiles && a.storageKey) {
        const buf = await readStoredFile(a.storageKey)
        if (buf) data = buf.toString("base64")
      }
      exportedFiles.push(data ? { ...rest, data } : rest)
    }
    out.push({ ...challenge, log: log.map(stripLog), attachments: exportedFiles })
  }
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    challenges: out,
  }
}

const STATUS_SECTIONS = [
  { status: "active", heading: "Currently exploring" },
  { status: "backlog", heading: "Backlog" },
  { status: "completed", heading: "Completed" },
  { status: "abandoned", heading: "Archive" },
] as const

function fmtDate(d: Date | null | undefined, withTime = false) {
  if (!d) return ""
  return format(d, withTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd")
}

function quote(text: string) {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")
}

function attachmentLine(a: Attachment) {
  const label = a.title || a.fileName || a.url || "note"
  if (a.kind === "url" && a.url) return `- [${label}](${a.url})`
  if (a.kind === "text") return `- 📝 ${a.title ?? "Note"}\n\n${quote(a.content ?? "")}`
  return `- 📎 ${label}${a.mimeType ? ` (${a.mimeType})` : ""}`
}

export function renderMarkdown(vault: VaultSnapshot, now: Date = new Date()): string {
  const lines: string[] = [`# Challenge Vault`, "", `_Exported ${fmtDate(now, true)}_`, ""]
  for (const section of STATUS_SECTIONS) {
    const items = vault.filter((c) => c.status === section.status)
    if (items.length === 0) continue
    lines.push(`## ${section.heading} (${items.length})`, "")
    for (const c of items) {
      lines.push(`### ${c.favorite ? "⭐ " : ""}${c.title}`, "")
      const meta: string[] = []
      if (c.category) meta.push(`**Category:** ${c.category}`)
      if (c.tags.length) meta.push(`**Tags:** ${c.tags.map((t) => `#${t}`).join(" ")}`)
      if (c.estimatedDuration) meta.push(`**Estimate:** ~${formatMinutes(c.estimatedDuration)}`)
      meta.push(`**Captured:** ${fmtDate(c.createdAt)}`)
      if (c.startedAt) meta.push(`**Started:** ${fmtDate(c.startedAt)}`)
      if (c.completedAt) meta.push(`**Completed:** ${fmtDate(c.completedAt)}`)
      if (c.abandonedAt) meta.push(`**Set aside:** ${fmtDate(c.abandonedAt)}${c.abandonReason ? ` — ${c.abandonReason}` : ""}`)
      const minutes = c.status === "completed" ? c.actualDuration : Math.round(c.trackedSeconds / 60)
      if (minutes) meta.push(`**Time spent:** ${formatMinutes(minutes)}`)
      if (c.enjoymentScore) meta.push(`**Enjoyment:** ${c.enjoymentScore}/10`)
      lines.push(meta.join("  \n"), "")
      if (c.description) lines.push(c.description, "")
      if (c.spark) lines.push("**Spark**", "", quote(c.spark), "")
      if (c.result) lines.push("**Result**", "", c.result, "")
      if (c.attachments.length) {
        lines.push("**Attachments**", "", ...c.attachments.map(attachmentLine), "")
      }
      const notes = c.log
      if (notes.length) {
        lines.push("**Log**", "")
        for (const e of notes) {
          const body = e.kind === "event" ? `_${e.content}_` : e.content.replace(/\n/g, "\n  ")
          lines.push(`- ${fmtDate(e.createdAt, true)} — ${body}`)
        }
        lines.push("")
      }
    }
  }
  if (vault.length === 0) lines.push("_The vault is empty._", "")
  return lines.join("\n")
}
