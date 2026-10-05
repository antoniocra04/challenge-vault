# Challenge Vault

A self-hosted vault of things you want to try.

Challenge Vault is **not** a todo list, task manager or habit tracker. It keeps
the ideas that once made you think *"oh, that would be interesting to try"*,
and gives them back to you when you have free time:

```
interesting idea → CAPTURE → backlog → … time passes … → open the vault →
browse → "oh, I want to do THIS" → START CHALLENGE → do the thing →
COMPLETE / RETURN TO VAULT / ABANDON
```

There are no deadlines, priorities, streaks, reminders or productivity scores.

## Features

- **Backlog** of challenge cards: browse, expand, start. Search, topic chips,
  context filters (time / location / money), starred ideas, and sorting by
  newest, oldest, recently updated, estimated time or **random order**.
- **Capture** in seconds: `+ CAPTURE` button or press <kbd>C</kbd> anywhere.
  Only the idea itself is required; the *spark* (why it seemed interesting)
  is optional but encouraged.
- **Currently exploring**: active challenges get a glowing panel on top of
  the vault with time spent, the spark and where you left off. Several can be
  active at once.
- **Session clock**: starting a challenge starts a clock; pause / resume it,
  discard a forgotten session, or adjust the time by hand. No fake progress
  bars.
- **Log**: optional short notes while working on a challenge, plus lifecycle
  markers (started, returned to vault, picked up again…).
- **Return to vault**: put an active challenge back into the backlog. The log,
  the original start date and the time spent are kept.
- **Complete**: what happened, how much you enjoyed it (1–10) and roughly how
  long it took. Completed challenges form a **collection**, not a ticket list.
- **Abandon**: optional reason, no judgement. Abandoned challenges live in the
  **archive** and can be brought back.
- **Attachments**: links, text notes, images, audio (with a player) and any
  other file.
- **Full-text search** over title, description, spark, result, tags, category,
  log entries and attachments.
- **Small statistics**: this year's completed / active / backlog, time spent and
  most explored topics.
- **Export / import**: JSON (with or without embedded files) and Markdown.
- **Single-user**, optional password, no telemetry, no external requests.

## Quick start (Docker)

Requirements: Docker with the Compose plugin.

```bash
git clone https://github.com/antoniocra04/challenge-vault.git
cd challenge-vault
cp .env.example .env
docker compose up -d
```

Open <http://localhost:3000>.

Before the first start, edit `.env` and at least change `POSTGRES_PASSWORD`.
Set `SEED_DEMO_DATA=true` if you want four example challenges in an empty vault.

Database migrations run automatically every time the app starts.

## Configuration

All settings live in `.env` (see [`.env.example`](.env.example)).

| Variable            | Default           | Meaning                                                                 |
| ------------------- | ----------------- | ----------------------------------------------------------------------- |
| `APP_PORT`          | `3000`            | Port published on the host.                                             |
| `APP_PASSWORD`      | *(empty)*         | Optional password. Empty = no login (single-user mode).                 |
| `COOKIE_SECURE`     | `false`           | Set `true` when served over HTTPS.                                      |
| `POSTGRES_USER`     | `vault`           | Database user.                                                          |
| `POSTGRES_PASSWORD` | `change-me`       | Database password.                                                      |
| `POSTGRES_DB`       | `challenge_vault` | Database name.                                                          |
| `SEED_DEMO_DATA`    | `false`           | Add the example challenges on start when the vault is empty.            |
| `MAX_UPLOAD_MB`     | `50`              | Max size of one attachment.                                             |
| `TZ`                | `UTC`             | Timezone for timestamps in exports.                                     |

Changing `APP_PASSWORD` signs out every open session.

Data is stored in two Docker volumes:

- `db-data`: PostgreSQL data
- `uploads`: uploaded attachment files

## Backup

The simplest complete backup is a **full JSON export**: open the database icon
in the header (`/data`) and click **JSON — full backup**. The file contains every
challenge, log entry and attachment, with uploaded files embedded.

From the command line (add `-H "Cookie: …"` if you set a password, or use the UI):

```bash
curl -o vault-backup.json http://localhost:3000/api/export/json
```

For a server-level backup, dump the database and archive the uploads volume:

```bash
# Database (uses the credentials from .env)
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' > vault.sql

# Uploaded files
docker compose run --rm --no-deps --user root --entrypoint sh -v "$PWD":/backup app \
  -c "tar czf /backup/uploads.tar.gz -C /data/uploads ."
```

## Restore

From a JSON export: open `/data`, choose the file, select **Replace everything**
and click **Import**. (Use **Merge** to add challenges from a file without
removing what's already there.)

From a database dump and uploads archive:

```bash
docker compose up -d db
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < vault.sql

docker compose run --rm --no-deps --user root --entrypoint sh -v "$PWD":/backup app \
  -c "tar xzf /backup/uploads.tar.gz -C /data/uploads && chown -R vault:vault /data/uploads"

docker compose up -d
```

## JSON export

- `/data` → **JSON — full backup**, or `GET /api/export/json`
- Without file contents (much smaller): **JSON — without files**, or
  `GET /api/export/json?files=0`
- Readable document: **Markdown**, or `GET /api/export/markdown`

Format (version 1):

```json
{
  "format": "challenge-vault",
  "version": 1,
  "exportedAt": "2026-10-05T21:14:00.000Z",
  "challenges": [
    {
      "id": "…uuid…",
      "title": "Smart Apartment",
      "description": "…",
      "spark": "…",
      "category": "Home",
      "tags": ["home", "hardware"],
      "status": "completed",
      "favorite": false,
      "estimatedDuration": 360,
      "actualDuration": 720,
      "requiresLeavingHome": false,
      "requiresMoney": true,
      "result": "Found ~800 ₽/month of unnecessary consumption.",
      "enjoymentScore": 9,
      "createdAt": "…", "startedAt": "…", "completedAt": "…",
      "log": [{ "id": "…", "content": "Поднял MQTT", "kind": "note", "createdAt": "…" }],
      "attachments": [{ "id": "…", "kind": "image", "fileName": "reference.jpg", "mimeType": "image/jpeg", "data": "…base64…" }]
    }
  ]
}
```

Durations are in minutes.

## JSON import

`/data` → choose a `.json` file → pick a mode → **Import**.

- **Merge**: challenges from the file are added; a challenge whose `id`
  already exists is replaced by the file's version (including its log and
  attachments). Importing the same file twice doesn't create duplicates.
- **Replace everything**: the vault is wiped first, then restored from the file.

Only `title` is required, so hand-written files work too:

```json
[
  { "title": "Сыграть Love You to Death от начала до конца", "tags": ["music", "bass"] },
  { "title": "Запустить самую большую LLM, которую потянет мой компьютер", "spark": "Где предел у видеокарты?" }
]
```

Equivalent API call: `POST /api/import?mode=merge|replace` with a multipart
`file` field.

## Updating

```bash
cd challenge-vault
git pull
docker compose up -d --build
```

Migrations are applied automatically on startup. Making a JSON export before
updating is a good idea.

## Development

Requirements: Node.js 20.9+ and a PostgreSQL 14+ database.

```bash
npm install
cp .env.example .env          # point DATABASE_URL at your local database
npm run db:migrate            # apply migrations (also runs automatically on `npm run dev`)
npm run db:seed               # add the example challenges (idempotent)
npm run dev                   # http://localhost:3000
```

| Command               | What it does                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| `npm run dev`         | Development server.                                                     |
| `npm run build`       | Production build (`output: "standalone"`).                              |
| `npm run typecheck`   | Generate route types and run `tsc`.                                     |
| `npm run lint`        | ESLint.                                                                 |
| `npm test`            | Unit tests; DB integration tests too when `TEST_DATABASE_URL` is set.   |
| `npm run test:e2e`    | Playwright tests against a running instance (`E2E_BASE_URL`, `E2E_PASSWORD`). |
| `npm run db:generate` | Create a new migration after changing `src/db/schema.ts`.               |
| `npm run db:migrate`  | Apply migrations.                                                       |
| `npm run db:seed`     | Seed example challenges (`-- --reset` wipes the vault first).           |

`TEST_DATABASE_URL` must point at a **separate, disposable** database: the
integration tests delete everything in it.

## Architecture

- **Next.js 16** (App Router, Server Components, Server Actions), TypeScript,
  Tailwind CSS 4, shadcn/ui (Radix). Dark mode only.
- **PostgreSQL** via **Drizzle ORM** (`postgres` driver). SQL migrations live
  in `drizzle/` and are applied on server start (`src/instrumentation.ts`).
- Reads happen in Server Components; mutations go through Server Actions
  (`src/app/actions.ts`) that call a small service layer
  (`src/lib/challenges/mutations.ts`). State transitions are guarded in SQL,
  so double clicks or stale tabs can't corrupt anything.
- File uploads, downloads, export and import are route handlers under
  `src/app/api/`. Files are stored on disk in `UPLOAD_DIR` under random names.
- Optional password: `src/proxy.ts` checks an HMAC session cookie for pages and
  actions; API routes check it themselves.
- Fonts are bundled (Inter, JetBrains Mono) — the app makes no external requests.

### Data model

- `challenges`: title, description, spark, category, tags, status
  (`backlog` / `active` / `completed` / `abandoned`), favorite, estimated and
  actual duration (minutes), home / money flags, result, enjoyment score,
  abandon reason, tracked seconds and current session start, timestamps.
- `challenge_log_entries`: notes (`note`) and lifecycle markers (`event`).
- `attachments`: `url`, `text`, `image`, `audio` or `file`.

### Routes

| Route                 | Screen                                                 |
| --------------------- | ------------------------------------------------------ |
| `/`                   | Vault: currently exploring, backlog, stats             |
| `/active`             | Active challenges                                      |
| `/completed`          | The collection of completed challenges                 |
| `/archive`            | Abandoned challenges                                   |
| `/challenge/[id]`     | Challenge detail: spark, log, attachments, actions     |
| `/data`               | Export / import                                        |
| `/login`              | Only when `APP_PASSWORD` is set                        |

### Keyboard

- <kbd>C</kbd> — capture a new challenge
- <kbd>/</kbd> — search the backlog
- <kbd>Enter</kbd> in the capture dialog saves; <kbd>Ctrl/⌘</kbd>+<kbd>Enter</kbd> saves notes

## Privacy

No telemetry, analytics or tracking, and no cloud dependencies. Next.js
telemetry is disabled in the Docker image (`NEXT_TELEMETRY_DISABLED=1`).
Everything stays in your PostgreSQL database and uploads volume.
