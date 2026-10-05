// Single-user password protection. When APP_PASSWORD is empty the vault is
// open. Otherwise a session cookie holds an HMAC derived from the password,
// so changing the password signs everyone out.

export const SESSION_COOKIE = "cv_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365

export function appPassword(): string | null {
  const pw = process.env.APP_PASSWORD
  return pw && pw.length > 0 ? pw : null
}

export function isAuthEnabled(): boolean {
  return appPassword() !== null
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function sessionToken(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode("challenge-vault-session-v1")))
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  const pw = appPassword()
  if (!pw) return true
  if (!token) return false
  return constantTimeEqual(token, await sessionToken(pw))
}

/** Auth check for route handlers (which the proxy doesn't cover). */
export async function isRequestAuthorized(request: Request): Promise<boolean> {
  if (!isAuthEnabled()) return true
  const cookie = request.headers.get("cookie") ?? ""
  const match = cookie.split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`))
  const token = match ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)) : null
  return isValidSessionToken(token)
}

export function cookieSecure(): boolean {
  return process.env.COOKIE_SECURE === "true"
}
