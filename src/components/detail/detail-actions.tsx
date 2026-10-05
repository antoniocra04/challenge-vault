"use client"

import { CheckIcon, XIcon } from "lucide-react"
import {
  AbandonDialog,
  CompleteDialog,
  RestoreButton,
  ReturnToVaultButton,
  SessionControls,
  StartChallengeButton,
} from "@/components/challenge/actions"
import { Button } from "@/components/ui/button"
import type { Challenge } from "@/db/schema"

export function DetailActions({ challenge: c }: { challenge: Challenge }) {
  const complete = (
    <CompleteDialog
      id={c.id}
      title={c.title}
      trackedSeconds={c.trackedSeconds}
      sessionStartedAt={c.sessionStartedAt}
      trigger={(open) =>
        c.status === "active" ? (
          <Button
            onClick={open}
            className="h-10 bg-jade font-mono text-xs font-semibold tracking-[0.14em] text-black uppercase hover:bg-jade/85"
          >
            <CheckIcon />
            Complete challenge
          </Button>
        ) : (
          <button
            type="button"
            onClick={open}
            className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase hover:text-jade"
          >
            Already did it? Mark complete
          </button>
        )
      }
    />
  )

  const abandon = (
    <AbandonDialog
      id={c.id}
      title={c.title}
      trigger={(open) => (
        <Button
          variant="ghost"
          onClick={open}
          className="h-10 font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase"
        >
          <XIcon />
          Abandon
        </Button>
      )}
    />
  )

  switch (c.status) {
    case "backlog":
      return (
        <div className="grid gap-3">
          <StartChallengeButton id={c.id} size="lg" className="h-11 w-full" />
          <div className="flex items-center justify-between gap-2">
            {complete}
            {abandon}
          </div>
        </div>
      )
    case "active":
      return (
        <div className="grid gap-3">
          <div className="rounded-lg border border-ember/20 bg-ember/[0.04] px-3 py-2.5">
            <SessionControls id={c.id} sessionStartedAt={c.sessionStartedAt} />
          </div>
          {complete}
          <ReturnToVaultButton id={c.id} className="h-10" />
          {abandon}
        </div>
      )
    case "completed":
      return (
        <div className="grid gap-2">
          <RestoreButton id={c.id} label="Do it again" />
          <p className="font-mono text-[11px] text-faint">Puts it back into the backlog, keeping the history.</p>
        </div>
      )
    case "abandoned":
      return (
        <div className="grid gap-2">
          <RestoreButton id={c.id} label="Back to vault" />
          <p className="font-mono text-[11px] text-faint">Interest came back? It happens.</p>
        </div>
      )
  }
}
