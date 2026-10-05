import { format } from "date-fns"
import { isRequestAuthorized } from "@/lib/auth"
import { buildJsonExport } from "@/lib/transfer/export"

export async function GET(request: Request) {
  if (!(await isRequestAuthorized(request))) return new Response("Unauthorized", { status: 401 })
  const url = new URL(request.url)
  const includeFiles = url.searchParams.get("files") !== "0"
  const data = await buildJsonExport({ includeFiles })
  const name = `challenge-vault-${format(new Date(), "yyyy-MM-dd")}${includeFiles ? "" : "-no-files"}.json`
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  })
}
