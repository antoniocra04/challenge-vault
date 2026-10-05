import "dotenv/config"
import { closeDb, db } from "@/db"
import { runMigrations } from "@/db/migrate"
import { challenges } from "@/db/schema"
import { seedChallenges } from "@/db/seed"

// Usage: npm run db:seed            — add the demo challenges (idempotent)
//        npm run db:seed -- --reset — wipe the vault first (development only!)
async function main() {
  await runMigrations()
  if (process.argv.includes("--reset")) {
    await db.delete(challenges)
    console.log("Vault wiped.")
  }
  const n = await seedChallenges()
  console.log(n ? `Seeded ${n} challenges.` : "Seed challenges already present.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => closeDb())
