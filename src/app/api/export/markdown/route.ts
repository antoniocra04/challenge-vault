import { format } from "date-fns"
import { isRequestAuthorized } from "@/lib/auth"
import { loadVault, renderMarkdown } from "@/lib/transfer/export"

export async function GET(request: Request) {
  if (!(await isRequestAuthorized(request))) return new Response("Unauthorized", { status: 401 })
  const markdown = renderMarkdown(await loadVault())
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="challenge-vault-${format(new Date(), "yyyy-MM-dd")}.md"`,
      "Cache-Control": "no-store",
    },
  })
}
