import type { Metadata } from "next"
import Link from "next/link"
import { CurrentChallenge } from "@/components/challenge/current-challenge"
import { SectionHeading } from "@/components/challenge/meta"
import { countBacklog, getActiveChallenges } from "@/lib/challenges/queries"

export const metadata: Metadata = { title: "В работе" }

export default async function ActivePage() {
  const [active, backlog] = await Promise.all([getActiveChallenges(), countBacklog()])
  return (
    <div>
      <SectionHeading as="h1" count={active.length}>
        В работе
      </SectionHeading>
      {active.length === 0 ? (
        <div className="frame px-6 py-14 text-center">
          <p className="text-muted-foreground">Сейчас ничего не начато.</p>
          {backlog > 0 && (
            <Link href="/" className="mt-4 inline-flex min-h-10 items-center text-sm underline underline-offset-4">
              Открыть список идей
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {active.length >= 3 && (
            <p className="text-sm text-muted-foreground">Идей в работе несколько. Лишние можно отложить.</p>
          )}
          {active.map((c) => (
            <CurrentChallenge key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  )
}
