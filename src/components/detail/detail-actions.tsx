"use client"

import {
  AbandonButton,
  AddNoteDialog,
  CompleteButton,
  RestoreButton,
  SessionControls,
  SetAsideMenu,
  StartChallengeButton,
} from "@/components/challenge/actions"
import type { Challenge } from "@/db/schema"

export function DetailActions({ challenge: c, accessionNo }: { challenge: Challenge; accessionNo: number }) {
  const complete = {
    id: c.id,
    title: c.title,
    accessionNo,
    trackedSeconds: c.trackedSeconds,
    sessionStartedAt: c.sessionStartedAt,
  }

  switch (c.status) {
    case "backlog":
      return (
        <div className="grid gap-2">
          <StartChallengeButton id={c.id} size="lg" className="w-full" />
          <div className="flex flex-wrap items-center gap-1">
            <CompleteButton {...complete} variant="ghost" label="Уже сделано" className="text-muted-foreground" />
            <AbandonButton id={c.id} title={c.title} neverStarted />
          </div>
        </div>
      )
    case "active":
      return (
        <div className="grid gap-3">
          <div className="rounded-md border border-ember/30 bg-ember/[0.06] px-3 py-2">
            <SessionControls id={c.id} sessionStartedAt={c.sessionStartedAt} />
          </div>
          <CompleteButton {...complete} size="lg" className="w-full" />
          <div className="grid grid-cols-2 gap-2">
            <AddNoteDialog id={c.id} />
            <SetAsideMenu id={c.id} title={c.title} />
          </div>
        </div>
      )
    case "completed":
      return (
        <div className="grid gap-2">
          <RestoreButton id={c.id} label="Сделать ещё раз" />
          <p className="text-xs text-muted-foreground">Вернётся в хранилище, история сохранится.</p>
        </div>
      )
    case "abandoned":
      return (
        <div className="grid gap-2">
          <RestoreButton id={c.id} />
          <p className="text-xs text-muted-foreground">Интерес вернулся? Так бывает.</p>
        </div>
      )
  }
}
