import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, isAuthEnabled, isValidSessionToken } from "@/lib/auth"

export async function proxy(request: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  if (pathname === "/login") return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (await isValidSessionToken(token)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = ""
  if (pathname !== "/") url.searchParams.set("next", pathname + search)
  return NextResponse.redirect(url)
}

export const config = {
  // API routes check auth themselves (see isRequestAuthorized) so that large
  // uploads and imports are streamed straight to the handler.
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icon.svg).*)"],
}
