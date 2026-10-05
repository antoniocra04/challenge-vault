"use client"

import { useOptimistic, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArchiveRestoreIcon,
  CheckIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  Undo2Icon,
  XIcon,
  ZapIcon,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAction } from "@/hooks/use-action"
import { ABANDON_REASONS, LONG_SESSION_SECONDS } from "@/lib/constants"
import { formatMinutes, parseDuration } from "@/lib/duration"
import { cn } from "@/lib/utils"
import { currentTrackedMinutes } from "@/lib/challenges/time"
import { SessionClock, useNow } from "./live-duration"

type Size = "sm" | "default" | "lg"

export function StartChallengeButton({
  id,
  size = "default",
  className,
  onStarted,
  tabIndex,
}: {
  id: string
  size?: Size
  className?: string
  onStarted?: () => void
  tabIndex?: number
}) {
  const { pending, run } = useAction()
  return (
    <Button
      size={size}
      disabled={pending}
      tabIndex={tabIndex}
      className={cn(
        "bg-ember font-mono text-xs font-semibold tracking-[0.14em] text-ember-foreground uppercase hover:bg-ember/85",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation()
        run(() => startChallenge(id), {
          onSuccess: () => {
            toast.success("Challenge started. Go do the thing ⚡")
            window.scrollTo({ top: 0, behavior: "smooth" })
            onStarted?.()
          },
        })
      }}
    >
      <ZapIcon />
      Start challenge
    </Button>
  )
}

export function FavoriteButton({ id, favorite, className }: { id: string; favorite: boolean; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic(favorite)
  const [, startTransition] = useTransition()
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? "Unstar" : "Star — I especially want to try this"}
      title={optimistic ? "Starred" : "Star — I especially want to try this someday"}
      className={cn(
        "grid size-7 place-items-center rounded-md transition-colors hover:bg-white/5",
        optimistic ? "text-ember" : "text-faint hover:text-muted-foreground",
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

export function ReturnToVaultButton({ id, size = "default", className }: { id: string; size?: Size; className?: string }) {
  const { pending, run } = useAction()
  return (
    <Button
      variant="outline"
      size={size}
      disabled={pending}
      className={cn("font-mono text-xs tracking-[0.12em] uppercase", className)}
      title="Not now. Keep the log and time, and put it back for later."
      onClick={() =>
        run(() => returnToVault(id), {
          success: "Back in the vault. It'll wait for you.",
        })
      }
    >
      <Undo2Icon />
      Return to vault
    </Button>
  )
}

export function RestoreButton({ id, size = "default", label = "Back to vault" }: { id: string; size?: Size; label?: string }) {
  const { pending, run } = useAction()
  return (
    <Button
      variant="outline"
      size={size}
      disabled={pending}
      className="font-mono text-xs tracking-[0.12em] uppercase"
      onClick={() => run(() => restoreToVault(id), { success: "Back in the vault." })}
    >
      <ArchiveRestoreIcon />
      {label}
    </Button>
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
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase transition-colors hover:text-ember"
        title="Start a session clock while you work on it"
      >
        <PlayIcon className="size-3" />
        Resume clock
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-wider text-ember uppercase">
        <span className="ember-dot size-1.5 rounded-full bg-ember" />
        Session <SessionClock sessionStartedAt={sessionStartedAt} />
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => pauseSession(id))}
        className="inline-flex items-center gap-1 font-mono text-[11px] tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
        title="Pause the clock — time so far is kept"
      >
        <PauseIcon className="size-3" />
        Pause
      </button>
      {long && !compact && (
        <span className="font-mono text-[11px] text-muted-foreground">
          clock running for a while — forgot to pause?{" "}
          <button
            type="button"
            className="underline underline-offset-2 hover:text-foreground"
            onClick={() => run(() => pauseSession(id, true), { success: "Session discarded." })}
          >
            discard this session
          </button>
        </span>
      )}
    </div>
  )
}

export function AddNoteDialog({
  id,
  trigger,
}: {
  id: string
  trigger?: (open: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    if (!content.trim()) return
    run(() => addLogEntry(id, content), {
      success: "Noted.",
      onSuccess: () => {
        setContent("")
        setOpen(false)
      },
    })
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button
          variant="outline"
          className="font-mono text-xs tracking-[0.12em] uppercase"
          onClick={() => setOpen(true)}
        >
          <PlusIcon />
          Add note
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="label-mono text-foreground">Log entry</DialogTitle>
            <DialogDescription>Where are you at? Future you will want to know where you stopped.</DialogDescription>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder="Поставил Shelly. Данные уже прилетают через MQTT."
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="font-mono text-[11px] text-faint">⌘/Ctrl + Enter</span>
              <Button type="submit" disabled={pending || !content.trim()}>
                Save note
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

const ENJOYMENT = Array.from({ length: 10 }, (_, i) => i + 1)

export function CompleteDialog({
  id,
  title,
  trackedSeconds,
  sessionStartedAt,
  trigger,
}: {
  id: string
  title: string
  trackedSeconds: number
  sessionStartedAt: Date | null
  trigger?: (open: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState("")
  const [score, setScore] = useState<number | null>(null)
  const [time, setTime] = useState("")
  const { pending, run } = useAction()
  const router = useRouter()

  const openDialog = () => {
    const minutes = currentTrackedMinutes(trackedSeconds, sessionStartedAt)
    setTime(minutes > 0 ? formatMinutes(minutes) : "")
    setOpen(true)
  }

  const parsedTime = parseDuration(time)
  const timeInvalid = time.trim() !== "" && parsedTime == null

  const submit = () => {
    if (timeInvalid) return
    run(
      () =>
        completeChallenge(id, {
          result,
          enjoymentScore: score,
          actualDuration: parsedTime,
        }),
      {
        onSuccess: () => {
          setOpen(false)
          toast.success(`“${title}” is now part of your collection ✓`, {
            action: { label: "View", onClick: () => router.push("/completed") },
          })
        },
      },
    )
  }

  return (
    <>
      {trigger ? (
        trigger(openDialog)
      ) : (
        <Button
          onClick={openDialog}
          className="bg-jade font-mono text-xs font-semibold tracking-[0.14em] text-black uppercase hover:bg-jade/85"
        >
          <CheckIcon />
          Complete
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="label-mono text-jade">Challenge complete</DialogTitle>
            <DialogDescription className="text-base text-foreground">{title}</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <label className="grid gap-2">
              <span className="text-sm text-muted-foreground">What happened?</span>
              <Textarea
                autoFocus
                rows={4}
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Built real-time monitoring. Found ~800 ₽/month of waste."
              />
            </label>
            <div className="grid gap-2">
              <span className="text-sm text-muted-foreground">How much did you enjoy doing it?</span>
              <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Enjoyment">
                {ENJOYMENT.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={score === n}
                    onClick={() => setScore(score === n ? null : n)}
                    className={cn(
                      "h-9 rounded-md border font-mono text-sm transition-all",
                      score != null && n <= score
                        ? "border-jade/50 bg-jade/15 text-jade"
                        : "border-border text-muted-foreground hover:border-white/20 hover:text-foreground",
                      score === n && "bg-jade/25 ring-1 ring-jade/60",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <label className="grid gap-2">
              <span className="text-sm text-muted-foreground">Approximately how much time did you spend?</span>
              <Input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="4h"
                aria-invalid={timeInvalid}
                className="max-w-40 font-mono"
              />
              {timeInvalid && <span className="text-xs text-destructive">Try something like 45m, 4h or 1h 30m</span>}
            </label>
            <DialogFooter className="mt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Not yet
              </Button>
              <Button
                type="submit"
                disabled={pending || timeInvalid}
                className="bg-jade font-mono text-xs font-semibold tracking-[0.14em] text-black uppercase hover:bg-jade/85"
              >
                <CheckIcon />
                Complete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AbandonDialog({
  id,
  title,
  trigger,
}: {
  id: string
  title: string
  trigger?: (open: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [other, setOther] = useState("")
  const { pending, run } = useAction()

  const submit = () => {
    const finalReason = reason === "other" ? other.trim() || "other" : reason
    run(() => abandonChallenge(id, finalReason), {
      success: "Let go. It's in the archive if you ever want it back.",
      onSuccess: () => {
        setOpen(false)
        setReason(null)
        setOther("")
      },
    })
  }

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button
          variant="ghost"
          className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase"
          onClick={() => setOpen(true)}
        >
          <XIcon />
          Abandon
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="label-mono text-foreground">Let it go?</DialogTitle>
            <DialogDescription>
              <span className="text-foreground">{title}</span>
              <br />
              Ideas are allowed to stop being interesting. It moves to the archive — no judgement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <span className="text-sm text-muted-foreground">
              Why? <span className="text-faint">(optional)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {ABANDON_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={reason === r.value}
                  onClick={() => setReason(reason === r.value ? null : r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                    reason === r.value
                      ? "border-foreground/40 bg-white/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {reason === "other" && (
              <Input
                autoFocus
                value={other}
                onChange={(e) => setOther(e.target.value)}
                placeholder="What changed?"
                className="mt-1"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep it
            </Button>
            <Button variant="secondary" disabled={pending} onClick={submit}>
              Let it go
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DeleteChallengeButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false)
  const { pending, run } = useAction()
  const router = useRouter()
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="font-mono text-[11px] tracking-wider text-faint uppercase hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon />
        Delete forever
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete “{title}”?</DialogTitle>
            <DialogDescription>
              This removes the challenge, its log and its attachments for good. If you just lost interest, abandoning
              keeps it in the archive instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                run(() => deleteChallenge(id), {
                  success: "Deleted.",
                  onSuccess: () => router.push("/"),
                })
              }
            >
              Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function OpenChallengeLink({ id, className }: { id: string; className?: string }) {
  return (
    <Button asChild variant="outline" className={cn("font-mono text-xs tracking-[0.12em] uppercase", className)}>
      <Link href={`/challenge/${id}`}>Open challenge</Link>
    </Button>
  )
}
