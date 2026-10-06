import { revalidatePath } from "next/cache"
import { isRequestAuthorized } from "@/lib/auth"
import { addFileAttachment, challengeExists } from "@/lib/challenges/mutations"
import { idSchema } from "@/lib/challenges/schemas"
import {
  attachmentKindForMime,
  deleteStoredFiles,
  maxUploadBytes,
  newStorageKey,
  writeStoredFile,
} from "@/lib/storage"

// Upload a file attachment: multipart form with `challengeId` and `file`.
export async function POST(request: Request) {
  if (!(await isRequestAuthorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const length = Number(request.headers.get("content-length") ?? 0)
  if (length > maxUploadBytes() + 64 * 1024) {
    return Response.json({ error: "Файл слишком большой." }, { status: 413 })
  }

  const form = await request.formData()
  const challengeId = idSchema.safeParse(form.get("challengeId"))
  const file = form.get("file")
  if (!challengeId.success || !(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Выберите файл." }, { status: 400 })
  }
  if (file.size > maxUploadBytes()) {
    return Response.json({ error: "Файл слишком большой." }, { status: 413 })
  }
  if (!(await challengeExists(challengeId.data))) {
    return Response.json({ error: "Идея не найдена." }, { status: 404 })
  }

  const mimeType = file.type || "application/octet-stream"
  const storageKey = newStorageKey()
  await writeStoredFile(storageKey, new Uint8Array(await file.arrayBuffer()))
  try {
    const titleField = form.get("title")
    const row = await addFileAttachment(challengeId.data, {
      kind: attachmentKindForMime(mimeType),
      fileName: file.name.slice(0, 300) || "file",
      mimeType,
      size: file.size,
      storageKey,
      title: typeof titleField === "string" && titleField.trim() ? titleField.trim().slice(0, 300) : null,
    })
    revalidatePath("/", "layout")
    return Response.json({ ok: true, id: row.id })
  } catch (err) {
    await deleteStoredFiles([storageKey])
    throw err
  }
}
