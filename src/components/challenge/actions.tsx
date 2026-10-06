"use client"

import { createContext, useCallback, useContext, useOptimistic, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  ChevronDownIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react"
import {
  abandonChallenge,
  addLogEntry,
  completeChallenge,
  deleteChallenge,
  pauseSession,
  restoreToVault,
  resumeSession,
  returnToVault,
  startChallenge,
  toggleFavorite,
} from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/hooks/use-action"
import { currentTrackedMinutes } from "@/lib/challenges/time"
import { ABANDON_REASONS, LONG_SESSION_SECONDS } from "@/lib/constants"
import { formatMinutes, parseDuration } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { SessionClock, useNow } from "./live-duration"

type Size = "sm" | "default" | "lg"

function submitOnModEnter(submit: () => void) {
  return (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }
}

export function StartChallengeButton({
  id,
  size = "default",
  className,
  tabIndex,
}: {
  id: string
  size?: Size
  className?: string
  tabIndex?: number
}) {
  const { pending, run } = useAction()
  return (
    <Button
      size={size}
      disabled={pending}
      tabIndex={tabIndex}
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        run(() => startChallenge(id), {
          onSuccess: () => {
            toast.success("Начато")
            window.scrollTo({ top: 0, behavior: "smooth" })
          },
        })
      }}
    >
      <PlayIcon />
      Начать
    </Button>
  )
}

export function FavoriteButton({ id, favorite, className }: { id: string; favorite: boolean; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(favorite)
  const [, startTransition] = useTransition()
  const label = optimistic ? "Убрать из избранного" : "В избранное"
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded transition-colors hover:bg-white/5 pointer-coarse:size-11",
        optimistic ? "text-foreground" : "text-faint hover:text-muted-foreground",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        startTransition(async () => {
          setOptimistic(!optimistic)
          const res = await toggleFavorite(id, !optimistic)
          if (!res.ok) toast.error(res.error)
        })
      }}
    >
      <StarIcon className={cn("size-4", optimistic && "fill-current")} />
    </button>
  )
}

export function RestoreButton({ id, size = "default", label = "Вернуть в идеи" }: { id: string; size?: Size; label?: string }) {
  const { pending, run } = useAction()
  return (
    <Button
      variant="outline"
      size={size}
      disabled={pending}
      onClick={() => run(() => restoreToVault(id), { success: "Идея возвращена в список" })}
    >
      <ArchiveRestoreIcon />
      {label}
    </Button>
  )
}

/** One button for both ways out of "in progress": back to the list, or to the archive. */
export function SetAsideMenu({
  id,
  title,
  size = "default",
  className,
}: {
  id: string
  title: string
  size?: Size
  className?: string
}) {
  const { pending, run } = useAction()
  const [archiving, setArchiving] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} disabled={pending} className={className}>
            Отложить
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1.5">
          <DropdownMenuItem
            className="flex-col items-start gap-0.5 px-2.5 py-2"
            onSelect={() => run(() => returnToVault(id), { success: "Идея возвращена в список" })}
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <Undo2Icon className="size-4" />
              Вернуть в идеи
            </span>
            <span className="pl-6 text-xs text-muted-foreground">Заметки и время сохранятся</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex-col items-start gap-0.5 px-2.5 py-2" onSelect={() => setArchiving(true)}>
            <span className="inline-flex items-center gap-2 font-medium">
              <ArchiveIcon className="size-4" />
              В архив
            </span>
            <span className="pl-6 text-xs text-muted-foreground">Можно вернуть в любой момент</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AbandonDialog id={id} title={title} open={archiving} onOpenChange={setArchiving} />
    </>
  )
}

export function SessionControls({
  id,
  sessionStartedAt,
  compact = false,
}: {
  id: string
  sessionStartedAt: Date | null
  compact?: boolean
}) {
  const { pending, run } = useAction()
  const running = sessionStartedAt != null
  const now = useNow(60_000, running)
  const long = running && now - new Date(sessionStartedAt).getTime() > LONG_SESSION_SECONDS * 1000

  if (!running) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => resumeSession(id))}
        className="inline-flex min-h-8 items-center gap-1.5 rounded text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
      >
        <PlayIcon className="size-3.5" />
        Запустить таймер
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="marker-dot size-1.5 rounded-full bg-marker" aria-hidden />
        <span className="sr-only">Таймер:</span>
        <span className="data">
          <SessionClock sessionStartedAt={sessionStartedAt} />
        </span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => pauseSession(id))}
        className="inline-flex min-h-8 items-center gap-1 rounded px-1 text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
      >
        <PauseIcon className="size-3.5" />
        Пауза
      </button>
      {long && !compact && (
        <span className="text-xs text-muted-foreground">
          Таймер идёт больше 8 часов.{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => run(() => pauseSession(id, true), { success: "Сессия не учтена" })}
          >
            Не учитывать эту сессию
          </button>
        </span>
      )}
    </div>
  )
}

export function AddNoteDialog({ id, size = "default" }: { id: string; size?: Size }) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    if (!content.trim()) return
    run(() => addLogEntry(id, content), {
      success: "Заметка сохранена",
      onSuccess: () => {
        setContent("")
        setOpen(false)
      },
    })
  }

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        <PlusIcon />
        Заметка
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Заметка</DialogTitle>
            <DialogDescription className="sr-only">Короткая заметка о том, как идут дела</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <Textarea
              autoFocus
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={submitOnModEnter(submit)}
              placeholder="Что сделано, на чём остановились"
              aria-label="Текст заметки"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="data hidden text-xs text-faint sm:inline">Ctrl + Enter</span>
              <Button type="submit" disabled={pending || !content.trim()} className="ml-auto">
                Сохранить
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1)

/** 1–10 as a radio group: one tab stop, arrow keys move the choice. */
export function EnjoymentScale({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const focusable = value ?? 1
  const move = (to: number) => {
    const next = Math.min(10, Math.max(1, to))
    onChange(next)
    refs.current[next - 1]?.focus()
  }
  return (
    <div
      role="radiogroup"
      aria-label="Насколько понравилось, от 1 до 10"
      className="grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-1"
      onKeyDown={(e) => {
        const current = value ?? 0
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault()
          move(current + 1)
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault()
          move(current - 1)
        } else if (e.key === "Home") {
          e.preventDefault()
          move(1)
        } else if (e.key === "End") {
          e.preventDefault()
          move(10)
        }
      }}
    >
      {SCORES.map((n) => (
        <button
          key={n}
          ref={(el) => {
            refs.current[n - 1] = el
          }}
          type="button"
          role="radio"
          aria-checked={value === n}
          tabIndex={n === focusable ? 0 : -1}
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            "data h-11 rounded border text-sm transition-colors sm:h-9 pointer-coarse:h-11",
            value === n
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:border-white/30 hover:text-foreground",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export function CompleteDialog({
  id,
  title,
  trackedSeconds,
  sessionStartedAt,
  open,
  onOpenChange,
}: {
  id: string
  title: string
  trackedSeconds: number
  sessionStartedAt: Date | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [result, setResult] = useState("")
  const [score, setScore] = useState<number | null>(null)
  // Remounted for every opening (see CompletionProvider), so this reads fresh time.
  const [time, setTime] = useState(() => {
    const minutes = currentTrackedMinutes(trackedSeconds, sessionStartedAt)
    return minutes > 0 ? formatMinutes(minutes) : ""
  })
  const { pending, run } = useAction()
  const router = useRouter()

  const parsedTime = parseDuration(time)
  const timeInvalid = time.trim() !== "" && parsedTime == null

  const submit = () => {
    if (timeInvalid || pending) return
    run(() => completeChallenge(id, { result, enjoymentScore: score, actualDuration: parsedTime }), {
      onSuccess: () => {
        onOpenChange(false)
        toast.success("Готово", {
          action: { label: "Открыть", onClick: () => router.push(`/completed?new=${id}`) },
        })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Завершить</DialogTitle>
          <DialogDescription className="text-base text-foreground">{title}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          onKeyDown={submitOnModEnter(submit)}
        >
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">
              Что получилось <span className="text-faint">— необязательно</span>
            </span>
            <Textarea autoFocus rows={4} value={result} onChange={(e) => setResult(e.target.value)} />
          </label>
          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">Насколько понравилось</span>
            <EnjoymentScale value={score} onChange={setScore} />
          </div>
          <label className="grid gap-2">
            <span className="text-sm text-muted-foreground">Сколько времени ушло</span>
            <Input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Например: 2 ч"
              aria-invalid={timeInvalid}
              className="data max-w-40"
            />
            {timeInvalid && <span className="text-xs text-destructive">Например: 45 мин, 2 ч или 1 ч 30 мин</span>}
          </label>
          <DialogFooter className="mt-1 items-center">
            <span className="data mr-auto hidden text-xs text-faint sm:inline">Ctrl + Enter</span>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending || timeInvalid}>
              <CheckIcon />
              Завершить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type CompletionTarget = Omit<React.ComponentProps<typeof CompleteDialog>, "open" | "onOpenChange">

const CompletionContext = createContext<(target: CompletionTarget) => void>(() => {})

/**
 * Hosts the completion dialog above the page: completing removes the panel
 * that opened it, and the dialog must not disappear mid-submit.
 */
export function CompletionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ target: CompletionTarget; nonce: number; open: boolean } | null>(null)
  const open = useCallback(
    (target: CompletionTarget) => setState((s) => ({ target, nonce: (s?.nonce ?? 0) + 1, open: true })),
    [],
  )
  return (
    <CompletionContext.Provider value={open}>
      {children}
      {state && (
        <CompleteDialog
          key={state.nonce}
          {...state.target}
          open={state.open}
          onOpenChange={(o) => setState((s) => (s ? { ...s, open: o } : s))}
        />
      )}
    </CompletionContext.Provider>
  )
}

export function CompleteButton({
  size = "default",
  className,
  label = "Завершить",
  variant = "default",
  ...target
}: CompletionTarget & {
  size?: Size
  className?: string
  label?: string
  variant?: "default" | "ghost"
}) {
  const openCompletion = useContext(CompletionContext)
  return (
    <Button variant={variant} size={size} className={className} onClick={() => openCompletion(target)}>
      <CheckIcon />
      {label}
    </Button>
  )
}

export function AbandonDialog({
  id,
  title,
  open,
  onOpenChange,
}: {
  id: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [reason, setReason] = useState<string | null>(null)
  const [other, setOther] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    const finalReason = reason === "другое" ? other.trim() || "другое" : reason
    run(() => abandonChallenge(id, finalReason), {
      success: "Перенесено в архив",
      onSuccess: () => {
        onOpenChange(false)
        setReason(null)
        setOther("")
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Убрать в архив?</DialogTitle>
          <DialogDescription>
            <span className="text-foreground">{title}</span>
            <br />
            Её можно будет вернуть.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm text-muted-foreground">
            Причина <span className="text-faint">— необязательно</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {ABANDON_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={reason === r.value}
                onClick={() => setReason(reason === r.value ? null : r.value)}
                className={cn(
                  "min-h-8 rounded-full border px-3 text-sm transition-colors pointer-coarse:min-h-11",
                  reason === r.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          {reason === "другое" && (
            <Input
              autoFocus
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Своя причина"
              aria-label="Своя причина"
              className="mt-1"
            />
          )}
        </fieldset>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button variant="secondary" disabled={pending} onClick={submit}>
            В архив
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AbandonButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className="text-muted-foreground">
        <ArchiveIcon />
        В архив
      </Button>
      <AbandonDialog id={id} title={title} open={open} onOpenChange={setOpen} />
    </>
  )
}

/** Small inline "are you sure?" in place of the browser's confirm(). */
export function ConfirmInline({
  label,
  onConfirm,
  disabled,
}: {
  label: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const [asking, setAsking] = useState(false)
  if (asking) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <button
          type="button"
          disabled={disabled}
          className="min-h-7 rounded px-1.5 text-destructive hover:bg-destructive/10 pointer-coarse:min-h-10"
          onClick={() => {
            setAsking(false)
            onConfirm()
          }}
        >
          Удалить
        </button>
        <button
          type="button"
          className="min-h-7 rounded px-1.5 text-muted-foreground hover:text-foreground pointer-coarse:min-h-10"
          onClick={() => setAsking(false)}
        >
          Отмена
        </button>
      </span>
    )
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => setAsking(true)}
      className="grid size-7 shrink-0 place-items-center rounded text-faint transition-colors hover:text-destructive pointer-coarse:size-10"
    >
      <Trash2Icon className="size-3.5" />
    </button>
  )
}

export function DeleteChallengeButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false)
  const { pending, run } = useAction()
  const router = useRouter()
  return (
    <>
      <Button variant="ghost" size="sm" className="text-faint hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2Icon />
        Удалить
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить «{title}»?</DialogTitle>
            <DialogDescription>
              Идея, заметки и вложения будут удалены без возможности восстановления. Чтобы просто убрать её с глаз,
              перенесите её в архив.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(() => deleteChallenge(id), {
                  success: "Удалено",
                  onSuccess: () => router.push("/"),
                })
              }
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function OpenChallengeLink({ id, className, children = "Открыть" }: { id: string; className?: string; children?: React.ReactNode }) {
  return (
    <Link
      href={`/challenge/${id}`}
      className={cn(
        "inline-flex min-h-9 items-center rounded px-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline pointer-coarse:min-h-11",
        className,
      )}
    >
      {children}
    </Link>
  )
}
