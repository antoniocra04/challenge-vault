import type { Metadata } from "next"
import Link from "next/link"
import { CurrentChallenge } from "@/components/challenge/current-challenge"
import { SectionLabel } from "@/components/challenge/meta"
import { countBacklog, getActiveChallenges } from "@/lib/challenges/queries"

export const metadata: Metadata = { title: "Active" }

export default async function ActivePage() {
  const [active, backlog] = await Promise.all([getActiveChallenges(), countBacklog()])
  return (
    <div>
      <SectionLabel count={active.length}>Active challenges</SectionLabel>
      {active.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="text-muted-foreground">Nothing in play right now.</p>
          {backlog > 0 && (
            <Link
              href="/"
              className="mt-4 inline-block font-mono text-xs tracking-[0.16em] text-ember uppercase underline-offset-4 hover:underline"
            >
              Browse {backlog} {backlog === 1 ? "idea" : "ideas"} in the vault →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {active.map((c) => (
            <CurrentChallenge key={c.id} challenge={c} />
          ))}
          {active.length >= 3 && (
            <p className="font-mono text-xs text-faint">
              Lots of fires lit. That&apos;s allowed — just check each one still feels warm. Anything that doesn&apos;t
              can go back to the vault, no harm done.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
