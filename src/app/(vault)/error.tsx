"use client"

import { Button } from "@/components/ui/button"

export default function VaultError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border p-8 text-center">
      <p className="label-mono">Something broke</p>
      <p className="mt-3 text-muted-foreground">
        {error.message.includes("DATABASE_URL") || error.message.includes("ECONNREFUSED")
          ? "Can't reach the database. Is it running?"
          : "An unexpected error happened. The details are in the server logs."}
      </p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-faint">ref {error.digest}</p>}
      <Button variant="outline" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
