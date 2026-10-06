import type { Metadata } from "next"
import Link from "next/link"
import { CurrentChallenge } from "@/components/challenge/current-challenge"
import { SectionHeading } from "@/components/challenge/meta"
import { countBacklog, getActiveChallenges } from "@/lib/challenges/queries"
import { plural } from "@/lib/plural"

export const metadata: Metadata = { title: "Сейчас" }

export default async function ActivePage() {
  const [active, backlog] = await Promise.all([getActiveChallenges(), countBacklog()])
  return (
    <div>
      <SectionHeading as="h1" count={active.length}>
        Сейчас в работе
      </SectionHeading>
      {active.length === 0 ? (
        <div className="specimen border-dashed px-6 py-14 text-center">
          <p className="text-muted-foreground">Сейчас ничего не в работе.</p>
          {backlog > 0 && (
            <Link
              href="/"
              className="mt-4 inline-flex min-h-10 items-center text-sm text-cabinet underline-offset-4 hover:underline"
            >
              {backlog} {plural(backlog, "идея ждёт", "идеи ждут", "идей ждут")} в хранилище →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {active.map((c) => (
            <CurrentChallenge key={c.id} challenge={c} />
          ))}
          {active.length >= 3 && (
            <p className="text-sm text-muted-foreground">
              Много огней сразу — это можно. Просто проверь, что каждый ещё греет. Остывшее можно отложить на потом,
              ничего не потеряется.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
