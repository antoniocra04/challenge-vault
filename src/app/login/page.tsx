import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { isAuthEnabled } from "@/lib/auth"
import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Вход" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // APP_PASSWORD is read at request time, never baked in at build time.
  await connection()
  if (!isAuthEnabled()) redirect("/")
  const { next } = await searchParams
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Challenge Vault</h1>
          <p className="mt-2 text-sm text-muted-foreground">То, что хочется попробовать.</p>
        </div>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
    </main>
  )
}
