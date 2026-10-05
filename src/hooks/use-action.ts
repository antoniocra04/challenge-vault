"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import type { ActionResult } from "@/app/actions"

/** Runs a server action inside a transition and surfaces errors as toasts. */
export function useAction() {
  const [pending, startTransition] = useTransition()

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    opts: { success?: string; onSuccess?: (data: T) => void } = {},
  ) {
    startTransition(async () => {
      const res = await action()
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      if (opts.success) toast.success(opts.success)
      opts.onSuccess?.(res.data)
    })
  }

  return { pending, run }
}
