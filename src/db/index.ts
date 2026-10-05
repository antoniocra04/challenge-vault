import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.")
  }
  const client = postgres(url, { max: 10, onnotice: () => {} })
  return { client, db: drizzle(client, { schema }) }
}

type DbBundle = ReturnType<typeof createDb>

// Reuse the connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __challengeVaultDb?: DbBundle }

function getBundle(): DbBundle {
  if (!globalForDb.__challengeVaultDb) {
    globalForDb.__challengeVaultDb = createDb()
  }
  return globalForDb.__challengeVaultDb
}

export type Db = DbBundle["db"]

// Lazily connect so that importing this module never requires a database
// (e.g. during `next build`).
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getBundle().db, prop, receiver)
  },
})

export async function closeDb() {
  const bundle = globalForDb.__challengeVaultDb
  if (bundle) {
    globalForDb.__challengeVaultDb = undefined
    await bundle.client.end({ timeout: 5 })
  }
}

export * as schema from "./schema"
