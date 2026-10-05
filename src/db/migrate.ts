import path from "node:path"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "./index"

export function migrationsFolder() {
  return process.env.MIGRATIONS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle")
}

export async function runMigrations() {
  await migrate(db, { migrationsFolder: migrationsFolder() })
}
