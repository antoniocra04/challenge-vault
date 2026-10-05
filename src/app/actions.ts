"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  appPassword,
  constantTimeEqual,
  cookieSecure,
  sessionToken,
} from "@/lib/auth"
import { VaultError } from "@/lib/challenges/errors"
import * as m from "@/lib/challenges/mutations"
import { idSchema, type ChallengeInput, type CompleteInput } from "@/lib/challenges/schemas"
import { deleteStoredFiles } from "@/lib/storage"

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    // Every view shows some aggregate (nav counts, stats), so refresh them all.
    revalidatePath("/", "layout")
    return { ok: true, data }
  } catch (err) {
    if (err instanceof VaultError) return { ok: false, error: err.message }
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Invalid input" }
    console.error(err)
    return { ok: false, error: "Something went wrong. Check the server logs." }
  }
}

function id(value: string) {
  const parsed = idSchema.safeParse(value)
  if (!parsed.success) throw new VaultError("Unknown challenge.")
  return parsed.data
}

export async function captureChallenge(input: ChallengeInput) {
  return run(async () => (await m.createChallenge(input)).id)
}

export async function updateChallenge(challengeId: string, input: ChallengeInput) {
  return run(async () => {
    await m.updateChallenge(id(challengeId), input)
  })
}

export async function deleteChallenge(challengeId: string) {
  return run(async () => {
    const keys = await m.deleteChallenge(id(challengeId))
    await deleteStoredFiles(keys)
  })
}

export async function toggleFavorite(challengeId: string, favorite: boolean) {
  return run(() => m.setFavorite(id(challengeId), favorite))
}

export async function startChallenge(challengeId: string) {
  return run(async () => {
    await m.startChallenge(id(challengeId))
  })
}

export async function returnToVault(challengeId: string) {
  return run(async () => {
    await m.returnToVault(id(challengeId))
  })
}

export async function completeChallenge(challengeId: string, input: CompleteInput) {
  return run(async () => {
    await m.completeChallenge(id(challengeId), input)
  })
}

export async function updateResult(challengeId: string, input: CompleteInput) {
  return run(() => m.updateResult(id(challengeId), input))
}

export async function abandonChallenge(challengeId: string, reason: string | null) {
  return run(async () => {
    await m.abandonChallenge(id(challengeId), { reason })
  })
}

export async function restoreToVault(challengeId: string) {
  return run(async () => {
    await m.restoreToVault(id(challengeId))
  })
}

export async function pauseSession(challengeId: string, discard = false) {
  return run(() => m.pauseSession(id(challengeId), { discard }))
}

export async function resumeSession(challengeId: string) {
  return run(() => m.resumeSession(id(challengeId)))
}

export async function setTimeSpent(challengeId: string, minutes: number) {
  return run(() => m.setTrackedMinutes(id(challengeId), minutes))
}

export async function addLogEntry(challengeId: string, content: string) {
  return run(async () => {
    await m.addLogEntry(id(challengeId), { content })
  })
}

export async function deleteLogEntry(entryId: string) {
  return run(async () => {
    await m.deleteLogEntry(id(entryId))
  })
}

export async function addLinkAttachment(challengeId: string, url: string, title: string | null) {
  return run(async () => {
    await m.addLinkAttachment(id(challengeId), { url, title })
  })
}

export async function addTextAttachment(challengeId: string, content: string, title: string | null) {
  return run(async () => {
    await m.addTextAttachment(id(challengeId), { content, title })
  })
}

export async function deleteAttachment(attachmentId: string) {
  return run(async () => {
    const row = await m.deleteAttachment(id(attachmentId))
    if (row?.storageKey) await deleteStoredFiles([row.storageKey])
  })
}

// --- Authentication -------------------------------------------------------

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const pw = appPassword()
  const next = String(formData.get("next") ?? "/")
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/"
  if (!pw) redirect(safeNext)

  const given = String(formData.get("password") ?? "")
  if (!constantTimeEqual(await sessionToken(given), await sessionToken(pw))) {
    await new Promise((r) => setTimeout(r, 400))
    return { error: "That's not it." }
  }
  const jar = await cookies()
  jar.set(SESSION_COOKIE, await sessionToken(pw), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  redirect(safeNext)
}

export async function logout() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  redirect("/login")
}
