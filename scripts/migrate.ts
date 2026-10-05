import "dotenv/config"
import { closeDb } from "@/db"
import { runMigrations } from "@/db/migrate"

async function main() {
  await runMigrations()
  console.log("Migrations applied.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => closeDb())
