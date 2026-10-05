"use client"

import { useActionState } from "react"
import { login, type LoginState } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  return (
    <form action={action} className="ember-panel grid gap-4 rounded-2xl p-6">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2">
        <span className="label-mono text-[10px]">Password</span>
        <Input name="password" type="password" autoFocus autoComplete="current-password" required />
      </label>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        disabled={pending}
        className="bg-ember font-mono text-xs font-semibold tracking-[0.16em] text-ember-foreground uppercase hover:bg-ember/85"
      >
        Open the vault
      </Button>
    </form>
  )
}
