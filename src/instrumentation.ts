export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  // Never touch the database while `next build` prerenders.
  if (process.env.NEXT_PHASE === "phase-production-build") return
  if (process.env.AUTO_MIGRATE === "false") return

  const { runMigrations } = await import("./db/migrate")
  await withRetry(runMigrations)

  if (process.env.SEED_DEMO_DATA === "true") {
    const { isVaultEmpty, seedChallenges } = await import("./db/seed")
    if (await isVaultEmpty()) {
      const n = await seedChallenges()
      console.log(`[challenge-vault] seeded ${n} demo challenges`)
    }
  }
}

// The database container may still be starting when the app boots.
async function withRetry(fn: () => Promise<void>, attempts = 15) {
  for (let i = 1; ; i++) {
    try {
      await fn()
      console.log("[challenge-vault] database migrations are up to date")
      return
    } catch (err) {
      if (i >= attempts) throw err
      console.warn(`[challenge-vault] database not ready (attempt ${i}/${attempts}): ${(err as Error).message}`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}
