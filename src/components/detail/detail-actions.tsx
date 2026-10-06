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

export function DetailActions({ challenge: c }: { challenge: Challenge }) {
  const complete = {
    id: c.id,
    title: c.title,
    trackedSeconds: c.trackedSeconds,
    sessionStartedAt: c.sessionStartedAt,
  }

  switch (c.status) {
    case "backlog":
      return (
        <div className="grid gap-2">
          <StartChallengeButton id={c.id} size="lg" className="w-full" />
          <div className="flex flex-wrap items-center gap-1">
            <CompleteButton {...complete} variant="ghost" label="Отметить сделанной" className="text-muted-foreground" />
            <AbandonButton id={c.id} title={c.title} />
          </div>
        </div>
      )
    case "active":
      return (
        <div className="grid gap-3">
          <div className="rounded border border-rule px-3 py-2">
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
          <RestoreButton id={c.id} />
          <p className="text-xs text-muted-foreground">Идея снова появится в списке. Заметки сохранятся.</p>
        </div>
      )
    case "abandoned":
      return <RestoreButton id={c.id} />
  }
}
