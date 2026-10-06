"use client"

import { useActionState } from "react"
import { login, type LoginState } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})
  return (
    <form action={action} className="specimen grid gap-4 p-6">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2">
        <span className="text-sm text-muted-foreground">Пароль</span>
        <Input name="password" type="password" autoFocus autoComplete="current-password" required />
      </label>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="ember" size="lg" disabled={pending}>
        Открыть хранилище
      </Button>
    </form>
  )
}
