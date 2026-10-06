"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDownIcon, PlusIcon } from "lucide-react"
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

  // Press C anywhere (any keyboard layout) to catch an idea before it evaporates.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.code === "KeyC" || e.key === "c" || e.key === "с") {
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
  const sparkRef = useRef<HTMLTextAreaElement>(null)
  const { pending, run } = useAction()
  const router = useRouter()

  const patch = (p: Partial<ChallengeFormState>) => setState((s) => ({ ...s, ...p }))
  const canSave = state.title.trim().length > 0 && !estimateError(state) && !pending

  const save = () => {
    if (!canSave) return
    run(() => captureChallenge(toChallengeInput(state)), {
      onSuccess: (id) => {
        toast.success("Поймано. Идея в хранилище.", {
          action: { label: "Открыть", onClick: () => router.push(`/challenge/${id}`) },
        })
        setState(EMPTY_FORM)
        setMore(false)
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-6 pb-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Новая идея</DialogTitle>
          <DialogDescription className="sr-only">Сохрани то, что когда-нибудь захочется попробовать.</DialogDescription>
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
            <span className="text-[15px] font-medium">Что хочется попробовать?</span>
            <Textarea
              autoFocus
              rows={2}
              value={state.title}
              onChange={(e) => patch({ title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey || e.metaKey || e.ctrlKey) return
                e.preventDefault()
                // On touch keyboards a stray Enter shouldn't commit the idea: move on instead.
                if (window.matchMedia("(pointer: coarse)").matches) sparkRef.current?.focus()
                else save()
              }}
              placeholder="Запустить самую большую LLM, которую потянет мой компьютер"
              className="min-h-0 resize-none text-base"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[15px] font-medium">
              Почему это кажется интересным? <span className="font-normal text-faint">(необязательно)</span>
            </span>
            <Textarea
              ref={sparkRef}
              rows={3}
              value={state.spark}
              onChange={(e) => patch({ spark: e.target.value })}
              placeholder="Через пару месяцев название ничего не скажет. Запиши искру."
            />
          </label>

          <div>
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
              aria-expanded={more}
            >
              <ChevronDownIcon className={cn("size-4 transition-transform", more && "rotate-180")} />
              Подробности
            </button>
            {more && (
              <div className="mt-4">
                <ChallengeDetailFields state={state} onChange={patch} tagSuggestions={tagSuggestions} />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t border-rule bg-popover px-6 py-4">
            <span className="hidden text-xs text-faint sm:inline">
              <span className="data">Enter</span> — сохранить, <span className="data">Shift+Enter</span> — новая строка
            </span>
            <Button type="submit" variant="cabinet" size="lg" disabled={!canSave} className="ml-auto">
              В хранилище
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CaptureButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { open } = useCapture()
  return (
    <Button
      variant="cabinet"
      onClick={open}
      title="Поймать идею (C)"
      aria-label={compact ? "Поймать идею" : undefined}
      className={cn(compact ? "size-12 rounded-full p-0 shadow-[0_8px_20px_-8px_oklch(0.05_0.02_230/90%)]" : "", className)}
    >
      <PlusIcon className={compact ? "size-5" : undefined} />
      {!compact && "Поймать"}
    </Button>
  )
}
