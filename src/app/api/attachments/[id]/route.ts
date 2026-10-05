import { Readable } from "node:stream"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { attachments } from "@/db/schema"
import { isRequestAuthorized } from "@/lib/auth"
import { idSchema } from "@/lib/challenges/schemas"
import { openStoredFileStream, statStoredFile } from "@/lib/storage"

// Types that are safe to render inline. Everything else is downloaded so an
// uploaded HTML/SVG file can never run scripts on this origin.
const INLINE = /^(image\/(png|jpe?g|gif|webp|avif|bmp)|audio\/|video\/(mp4|webm|ogg)|application\/pdf|text\/plain)/

export async function GET(request: Request, ctx: RouteContext<"/api/attachments/[id]">) {
  if (!(await isRequestAuthorized(request))) return new Response("Unauthorized", { status: 401 })
  const { id } = await ctx.params
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) return new Response("Not found", { status: 404 })

  const [row] = await db.select().from(attachments).where(eq(attachments.id, parsed.data)).limit(1)
  if (!row?.storageKey) return new Response("Not found", { status: 404 })
  const stat = await statStoredFile(row.storageKey)
  if (!stat) return new Response("File is missing from storage", { status: 404 })

  const mime = row.mimeType ?? "application/octet-stream"
  const inline = INLINE.test(mime) && new URL(request.url).searchParams.get("download") !== "1"
  const name = row.fileName ?? "file"
  const headers: Record<string, string> = {
    "Content-Type": mime,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${name.replace(/[^\x20-\x7e]|"/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  }

  // Range support keeps audio seeking working.
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/)
  if (range && (range[1] || range[2])) {
    const size = stat.size
    let start = range[1] ? Number(range[1]) : size - Number(range[2])
    let end = range[1] && range[2] ? Number(range[2]) : size - 1
    start = Math.max(0, start)
    end = Math.min(end, size - 1)
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } })
    }
    const stream = openStoredFileStream(row.storageKey, { start, end })
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    })
  }

  const stream = openStoredFileStream(row.storageKey)
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: { ...headers, "Content-Length": String(stat.size) },
  })
}
