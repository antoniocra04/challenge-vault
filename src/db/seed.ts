import { sql } from "drizzle-orm"
import { db } from "./index"
import { challenges } from "./schema"
import { SEED_CHALLENGES } from "./seed-data"
import { createChallenge } from "@/lib/challenges/mutations"

/** Inserts seed challenges whose titles aren't in the vault yet. */
export async function seedChallenges(): Promise<number> {
  const existing = await db.select({ title: challenges.title }).from(challenges)
  const titles = new Set(existing.map((r) => r.title.toLowerCase()))
  let inserted = 0
  for (const challenge of SEED_CHALLENGES) {
    if (titles.has(challenge.title.toLowerCase())) continue
    await createChallenge(challenge)
    inserted++
  }
  return inserted
}

export async function isVaultEmpty(): Promise<boolean> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(challenges)
  return (row?.n ?? 0) === 0
}
