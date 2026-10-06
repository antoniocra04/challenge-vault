"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"
import { updateChallenge, updateResult } from "@/app/actions"
import {
  ChallengeDetailFields,
  estimateError,
  formStateFrom,
  toChallengeInput,
  type ChallengeFormState,
} from "@/components/challenge/challenge-fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EnjoymentScale } from "@/components/challenge/actions"
import type { Challenge } from "@/db/schema"
import { useAction } from "@/hooks/use-action"
import { formatMinutes, parseDuration } from "@/lib/duration"

export function EditChallenge({ challenge: c, tagSuggestions }: { challenge: Challenge; tagSuggestions: string[] }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ChallengeFormState>(() => formStateFrom(c))
  const [result, setResult] = useState(c.result ?? "")
  const [score, setScore] = useState<number | null>(c.enjoymentScore)
  const [time, setTime] = useState(c.actualDuration != null ? formatMinutes(c.actualDuration) : "")
  const { pending, run } = useAction()
  const completed = c.status === "completed"
  const timeInvalid = completed && time.trim() !== "" && parseDuration(time) == null
  const invalid = !state.title.trim() || estimateError(state) != null || timeInvalid

  const patch = (p: Partial<ChallengeFormState>) => setState((s) => ({ ...s, ...p }))

  const openDialog = () => {
    setState(formStateFrom(c))
    setResult(c.result ?? "")
    setScore(c.enjoymentScore)
    setTime(c.actualDuration != null ? formatMinutes(c.actualDuration) : "")
    setOpen(true)
  }

  const save = () => {
    if (invalid) return
    run(
      async () => {
        const res = await updateChallenge(c.id, toChallengeInput(state))
        if (!res.ok || !completed) return res
        return updateResult(c.id, { result, enjoymentScore: score, actualDuration: parseDuration(time) })
      },
      { success: "Сохранено.", onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={openDialog}
        className="text-muted-foreground"
      >
        <PencilIcon />
        Изменить
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Изменить идею</DialogTitle>
            <DialogDescription className="sr-only">Название, искра и подробности.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <label className="grid gap-1.5">
              <span className="text-sm text-muted-foreground">Название</span>
              <Input value={state.title} onChange={(e) => patch({ title: e.target.value })} className="text-base" />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm text-muted-foreground">Искра — почему это казалось интересным?</span>
              <Textarea rows={3} value={state.spark} onChange={(e) => patch({ spark: e.target.value })} />
            </label>
            <ChallengeDetailFields state={state} onChange={patch} tagSuggestions={tagSuggestions} />

            {completed && (
              <div className="mt-2 grid gap-4 border-t border-rule pt-4">
                <label className="grid gap-1.5">
                  <span className="text-sm text-muted-foreground">Что получилось?</span>
                  <Textarea rows={3} value={result} onChange={(e) => setResult(e.target.value)} />
                </label>
                <div className="grid gap-1.5">
                  <span className="text-sm text-muted-foreground">Насколько было интересно</span>
                  <EnjoymentScale value={score} onChange={setScore} />
                </div>
                <label className="grid gap-1.5">
                  <span className="text-sm text-muted-foreground">Сколько времени ушло</span>
                  <Input
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-invalid={timeInvalid}
                    className="data max-w-40"
                    placeholder="4 ч"
                  />
                </label>
              </div>
            )}

            <DialogFooter className="mt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={pending || invalid}>
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
