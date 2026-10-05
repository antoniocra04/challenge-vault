"use client"

import { useCapture } from "@/components/capture/capture-provider"

export function EmptyVault() {
  const { open } = useCapture()
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <p className="label-mono mb-3 text-ember">The vault is empty</p>
      <p className="mx-auto max-w-md text-muted-foreground">
        Next time something makes you think <span className="text-foreground">“oh, that would be interesting to try”</span> —
        drop it in here before it evaporates.
      </p>
      <button
        type="button"
        onClick={open}
        className="mt-6 font-mono text-xs tracking-[0.16em] text-ember uppercase underline-offset-4 hover:underline"
      >
        + Capture the first one
      </button>
      <p className="mt-2 font-mono text-[11px] text-faint">or press C anywhere</p>
    </div>
  )
}
