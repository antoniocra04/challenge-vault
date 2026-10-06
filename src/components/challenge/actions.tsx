"use client"

import { createContext, useCallback, useContext, useOptimistic, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArchiveRestoreIcon,
  ArchiveXIcon,
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
import { accession } from "@/lib/dates"
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
      variant="cabinet"
      size={size}
      disabled={pending}
      tabIndex={tabIndex}
      className={className}
      onClick={(e) => {
        e.stopPropagation()
        run(() => startChallenge(id), {
          onSuccess: () => {
            toast.success("Поехали. Иди делай.")
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
  const label = optimistic ? "Убрать звезду" : "Отметить звездой — особенно хочется попробовать"
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-md transition-colors hover:bg-white/5 pointer-coarse:size-11",
        optimistic ? "text-cabinet" : "text-faint hover:text-muted-foreground",
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

export function RestoreButton({ id, size = "default", label = "Вернуть в хранилище" }: { id: string; size?: Size; label?: string }) {
  const { pending, run } = useAction()
  return (
    <Button
      variant="outline"
      size={size}
      disabled={pending}
      onClick={() => run(() => restoreToVault(id), { success: "Снова в хранилище." })}
    >
      <ArchiveRestoreIcon />
      {label}
    </Button>
  )
}

/**
 * "Set aside" is one honest question with two answers: for later (back to the
 * vault, keeping log and time) or for good (let it go, into the archive).
 */
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
  const [letGo, setLetGo] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} disabled={pending} className={className}>
            Отложить
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-1.5">
          <DropdownMenuItem
            className="flex-col items-start gap-0.5 px-2.5 py-2"
            onSelect={() => run(() => returnToVault(id), { success: "Снова в хранилище — подождёт до лучших времён." })}
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <Undo2Icon className="size-4" />
              На потом
            </span>
            <span className="pl-6 text-xs text-muted-foreground">
              Вернуть в хранилище. Журнал, дата начала и время сохранятся.
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex-col items-start gap-0.5 px-2.5 py-2" onSelect={() => setLetGo(true)}>
            <span className="inline-flex items-center gap-2 font-medium">
              <ArchiveXIcon className="size-4" />
              Насовсем
            </span>
            <span className="pl-6 text-xs text-muted-foreground">Отпустить в архив. Оттуда всегда можно вернуть.</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AbandonDialog id={id} title={title} open={letGo} onOpenChange={setLetGo} />
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
        className="inline-flex min-h-8 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-ember pointer-coarse:min-h-11"
        title="Запустить часы, пока занимаешься"
      >
        <PlayIcon className="size-3.5" />
        Запустить часы
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2 text-sm text-ember">
        <span className="ember-dot size-1.5 rounded-full bg-ember" aria-hidden />
        <span className="sr-only">Сессия идёт:</span>
        <span className="data">
          <SessionClock sessionStartedAt={sessionStartedAt} />
        </span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => pauseSession(id))}
        className="inline-flex min-h-8 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-11"
        title="Остановить часы — время сохранится"
      >
        <PauseIcon className="size-3.5" />
        Пауза
      </button>
      {long && !compact && (
        <span className="text-xs text-muted-foreground">
          Часы идут давно — может, пора остановить?{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => run(() => pauseSession(id, true), { success: "Сессия не засчитана." })}
          >
            Не засчитывать эту сессию
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
      success: "Записано.",
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
            <DialogTitle>Запись в журнал</DialogTitle>
            <DialogDescription>Где ты сейчас? Потом пригодится, чтобы понять, с чего продолжить.</DialogDescription>
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
              placeholder="Что сделано, что выяснилось, где затык…"
              aria-label="Текст записи"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="data hidden text-xs text-faint sm:inline">⌘/Ctrl + Enter</span>
              <Button type="submit" disabled={pending || !content.trim()} className="ml-auto">
                Сохранить запись
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

const ENJOYMENT = Array.from({ length: 10 }, (_, i) => i + 1)

/** 1–10 scale as a real radio group: one tab stop, arrow keys move. */
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
      aria-label="Насколько было интересно, от 1 до 10"
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
      {ENJOYMENT.map((n) => (
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
            "data h-11 rounded-md border text-sm transition-colors sm:h-9 pointer-coarse:h-11",
            value != null && n <= value
              ? "border-jade/50 bg-jade/15 text-jade"
              : "border-border text-muted-foreground hover:border-white/25 hover:text-foreground",
            value === n && "bg-jade/30 text-foreground",
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
  accessionNo,
  trackedSeconds,
  sessionStartedAt,
  open,
  onOpenChange,
}: {
  id: string
  title: string
  accessionNo: number | null
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
  const [done, setDone] = useState<{ result: string; score: number | null; minutes: number | null } | null>(null)
  const { pending, run } = useAction()
  const router = useRouter()

  const parsedTime = parseDuration(time)
  const timeInvalid = time.trim() !== "" && parsedTime == null

  const submit = () => {
    if (timeInvalid || pending) return
    run(() => completeChallenge(id, { result, enjoymentScore: score, actualDuration: parsedTime }), {
      onSuccess: () => {
        setDone({ result: result.trim(), score, minutes: parsedTime })
        setResult("")
        setScore(null)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {done ? (
          <div className="grid gap-5">
            <DialogHeader>
              <DialogTitle>Каталогизировано</DialogTitle>
              <DialogDescription>Ещё одна находка в коллекции.</DialogDescription>
            </DialogHeader>
            <article className="catalogued catalogue-in p-5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="data text-jade">{accession(accessionNo)}</span>
                <span className="inline-flex items-center gap-1.5 text-jade">
                  <CheckIcon className="size-3.5" />
                  в коллекции
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-balance">{title}</h3>
              {done.result && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-foreground/85">{done.result}</p>}
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-rule pt-3 text-sm">
                {done.minutes != null && done.minutes > 0 && (
                  <div>
                    <dt className="text-xs text-faint">Потрачено</dt>
                    <dd className="data">{formatMinutes(done.minutes)}</dd>
                  </div>
                )}
                {done.score != null && (
                  <div>
                    <dt className="text-xs text-faint">Интерес</dt>
                    <dd className="data">{done.score}/10</dd>
                  </div>
                )}
              </dl>
            </article>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
              <Button
                variant="jade"
                autoFocus
                onClick={() => {
                  onOpenChange(false)
                  router.push(`/completed?new=${id}`)
                }}
              >
                Открыть коллекцию
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
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
                <span className="text-sm text-muted-foreground">Что получилось?</span>
                <Textarea
                  autoFocus
                  rows={4}
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Например: мониторинг работает, стало понятно, куда уходят деньги."
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm text-muted-foreground">Насколько было интересно этим заниматься?</span>
                <EnjoymentScale value={score} onChange={setScore} />
              </div>
              <label className="grid gap-2">
                <span className="text-sm text-muted-foreground">Сколько примерно времени ушло?</span>
                <Input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="4 ч"
                  aria-invalid={timeInvalid}
                  className="data max-w-40"
                />
                {timeInvalid && <span className="text-xs text-destructive">Попробуй так: 45 мин, 4 ч или 1 ч 30 мин</span>}
              </label>
              <DialogFooter className="mt-1 items-center">
                <span className="data mr-auto hidden text-xs text-faint sm:inline">⌘/Ctrl + Enter</span>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Ещё не всё
                </Button>
                <Button type="submit" variant="jade" disabled={pending || timeInvalid}>
                  <CheckIcon />
                  Завершить
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

type CompletionTarget = Omit<React.ComponentProps<typeof CompleteDialog>, "open" | "onOpenChange">

const CompletionContext = createContext<(target: CompletionTarget) => void>(() => {})

/**
 * Hosts the completion dialog above the page: completing a challenge removes
 * the panel that opened the dialog, and the "catalogued" moment must outlive it.
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
  variant = "jade",
  ...target
}: CompletionTarget & {
  size?: Size
  className?: string
  label?: string
  variant?: "jade" | "ghost"
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
  neverStarted = false,
}: {
  id: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
  neverStarted?: boolean
}) {
  const [reason, setReason] = useState<string | null>(null)
  const [other, setOther] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    const finalReason = reason === "другое" ? other.trim() || "другое" : reason
    run(() => abandonChallenge(id, finalReason), {
      success: "Отпущено. Если что — она в архиве.",
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
          <DialogTitle>{neverStarted ? "Убрать в архив?" : "Отпустить?"}</DialogTitle>
          <DialogDescription>
            <span className="text-foreground">{title}</span>
            <br />
            Идеям можно перестать быть интересными. Она уйдёт в архив — без всяких выводов.
          </DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm text-muted-foreground">
            Почему? <span className="text-faint">(необязательно)</span>
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
                    ? "border-foreground/40 bg-white/10 text-foreground"
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
              placeholder="Что изменилось?"
              aria-label="Своя причина"
              className="mt-1"
            />
          )}
        </fieldset>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Оставить
          </Button>
          <Button variant="secondary" disabled={pending} onClick={submit}>
            {neverStarted ? "Убрать в архив" : "Отпустить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AbandonButton({ id, title, neverStarted }: { id: string; title: string; neverStarted?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} className="text-muted-foreground">
        <ArchiveXIcon />
        {neverStarted ? "В архив" : "Отпустить"}
      </Button>
      <AbandonDialog id={id} title={title} open={open} onOpenChange={setOpen} neverStarted={neverStarted} />
    </>
  )
}

/** Small inline "are you sure?" that replaces native confirm(). */
export function ConfirmInline({
  label,
  confirmLabel = "Удалить",
  onConfirm,
  disabled,
}: {
  label: string
  confirmLabel?: string
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
          {confirmLabel}
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
        Удалить навсегда
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Удалить «{title}»?</DialogTitle>
            <DialogDescription>
              Идея, её журнал и вложения исчезнут насовсем. Если просто пропал интерес — лучше отпустить её в архив.
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
                  success: "Удалено.",
                  onSuccess: () => router.push("/"),
                })
              }
            >
              Удалить навсегда
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
        "inline-flex min-h-9 items-center rounded-md px-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline pointer-coarse:min-h-11",
        className,
      )}
    >
      {children}
    </Link>
  )
}
