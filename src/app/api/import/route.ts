import { revalidatePath } from "next/cache"
import { isRequestAuthorized } from "@/lib/auth"
import { VaultError } from "@/lib/challenges/errors"
import { importVault, parseImport, type ImportMode } from "@/lib/transfer/import"

export async function POST(request: Request) {
  if (!(await isRequestAuthorized(request))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const url = new URL(request.url)
  const mode: ImportMode = url.searchParams.get("mode") === "replace" ? "replace" : "merge"

  let json: unknown
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) return Response.json({ error: "Сначала выбери JSON-файл." }, { status: 400 })
    json = JSON.parse(await file.text())
  } catch {
    return Response.json({ error: "Это не JSON." }, { status: 400 })
  }

  try {
    const result = await importVault(parseImport(json), mode)
    revalidatePath("/", "layout")
    return Response.json({ ok: true, result })
  } catch (err) {
    if (err instanceof VaultError) return Response.json({ error: err.message }, { status: 400 })
    console.error(err)
    return Response.json({ error: "Импорт не удался. Подробности в логах сервера." }, { status: 500 })
  }
}
