"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"
import { toast } from "sonner"
import { captureChallenge } from "@/app/actions"
import {
  ChallengeDetailFields,
  EMPTY_FORM,
  estimateError,
  toChallengeInput,
  type ChallengeFormState,
} from "@/components/challenge/challenge-fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/hooks/use-action"
import { cn } from "@/lib/utils"

const CaptureContext = createContext<{ open: () => void }>({ open: () => {} })

export function useCapture() {
  return useContext(CaptureContext)
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)))
}

export function CaptureProvider({ children, tagSuggestions }: { children: React.ReactNode; tagSuggestions: string[] }) {
  const [open, setOpen] = useState(false)
  const openCapture = useCallback(() => setOpen(true), [])

  // Press "c" anywhere to capture an idea before it evaporates.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.key === "c" || e.key === "с") {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <CaptureContext.Provider value={{ open: openCapture }}>
      {children}
      <CaptureDialog open={open} onOpenChange={setOpen} tagSuggestions={tagSuggestions} />
    </CaptureContext.Provider>
  )
}

function CaptureDialog({
  open,
  onOpenChange,
  tagSuggestions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tagSuggestions: string[]
}) {
  const [state, setState] = useState<ChallengeFormState>(EMPTY_FORM)
  const [more, setMore] = useState(false)
  const { pending, run } = useAction()
  const router = useRouter()

  const patch = (p: Partial<ChallengeFormState>) => setState((s) => ({ ...s, ...p }))
  const canSave = state.title.trim().length > 0 && !estimateError(state) && !pending

  const save = () => {
    if (!canSave) return
    run(() => captureChallenge(toChallengeInput(state)), {
      onSuccess: (id) => {
        toast.success("Saved to the vault ✦", {
          action: { label: "Open", onClick: () => router.push(`/challenge/${id}`) },
        })
        setState(EMPTY_FORM)
        setMore(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border border-white/10 bg-popover/95 p-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="label-mono text-ember">New challenge</DialogTitle>
          <DialogDescription className="sr-only">Capture an idea you might want to try someday.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              save()
            }
          }}
        >
          <label className="grid gap-2">
            <span className="text-[15px] font-medium">What do you want to try?</span>
            <Textarea
              autoFocus
              rows={2}
              value={state.title}
              onChange={(e) => patch({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault()
                  save()
                }
              }}
              placeholder="Запустить максимально большую LLM, которую переварит мой компьютер"
              className="min-h-0 resize-none text-base"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[15px] font-medium">
              Why does this seem interesting? <span className="font-normal text-faint">(optional)</span>
            </span>
            <Textarea
              rows={3}
              value={state.spark}
              onChange={(e) => patch({ spark: e.target.value })}
              placeholder="Future you will forget why this felt exciting. Write down the spark."
            />
          </label>

          <div>
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase transition-colors hover:text-foreground"
              aria-expanded={more}
            >
              <ChevronDownIcon className={cn("size-3.5 transition-transform", more && "rotate-180")} />
              Details
            </button>
            {more && (
              <div className="mt-4">
                <ChallengeDetailFields state={state} onChange={patch} tagSuggestions={tagSuggestions} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="hidden font-mono text-[11px] text-faint sm:inline">Enter to save · Shift+Enter for a new line</span>
            <Button
              type="submit"
              disabled={!canSave}
              className="h-10 bg-ember px-5 font-mono text-xs font-semibold tracking-[0.16em] text-ember-foreground uppercase hover:bg-ember/85"
            >
              Save to vault
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CaptureButton({ className }: { className?: string }) {
  const { open } = useCapture()
  return (
    <Button
      onClick={open}
      title="Capture an idea (C)"
      className={cn(
        "h-9 bg-ember px-4 font-mono text-xs font-semibold tracking-[0.16em] text-ember-foreground uppercase shadow-[0_0_24px_-6px] shadow-ember/50 hover:bg-ember/85",
        className,
      )}
    >
      + Capture
    </Button>
  )
}
