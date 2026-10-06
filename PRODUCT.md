# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person, self-hosting the app for themselves. They regularly run into questions, experiments, technical projects, music, photography and other things that make them think "oh, that would be interesting to try". Ideas arrive unevenly — several at once, then none for weeks — and are forgotten by the time free time appears. They open the vault on a laptop or a phone, usually in free time and often in the evening, to find something they genuinely want to do right now, instead of reflexively opening a game or a feed.

## Product Purpose

Challenge Vault preserves curiosity when it appears and lets it be rediscovered later. Ideas are captured in seconds, wait in a backlog, and are picked by eye when free time comes: start one, do the actual thing, then complete it, return it to the vault for later, or let it go. Success is the user opening the vault, seeing an old idea and thinking "right, I wanted to try this" — then closing the app and going to do it. The app does not optimize for how many challenges get completed.

## Positioning

It answers "what of the things that once interested me do I want to do now?", not "what do I have to do?". The spark — why an idea felt exciting when it was captured — is stored next to every idea so it can be recognized months later. There are no deadlines, priorities, reminders, streaks or scores; abandoning an idea is a normal outcome, not a failure.

## Operating Context

- Self-hosted with Docker Compose on the user's own server; single-user mode with an optional password.
- Primary loop: capture → backlog → (time passes) → browse → start → active → complete / return to vault / abandon.
- Several challenges may be active at once; the UI gently favours a small number without limits.
- An optional log of short notes records "where I stopped" for long challenges; attachments hold links, notes, images, audio and files.
- Challenge content is mostly written in Russian; the interface is in Russian.

## Capabilities and Constraints

- Challenge fields: title, description, spark, category, tags, status (backlog / active / completed / abandoned), estimated and actual duration, home/outside and money flags, result, enjoyment 1–10, favourite star, time spent via a session clock.
- Backlog: search (title, description, spark, result, tags, log, attachments), topic filters, context filters (time, location, money), sorting (newest, oldest, recently updated, estimated time) and random order.
- Completed challenges form a collection; abandoned ones stay in an archive and can be restored.
- Export/import JSON and Markdown export; no telemetry, analytics or external requests.
- Not in scope: AI recommendations, reminders, deadlines, streaks, gamification points, social features, complex auth.
- Terminology: never "task", "todo" or "assignment"; use challenge, idea, experiment, spark.

## Brand Commitments

- Name: Challenge Vault.
- Voice: warm, frank, no guilt. Letting an idea go is fine ("Ideas are allowed to stop being interesting"). The existing wording and voice are to be kept when copy is translated.
- Dark mode first. The active challenge carries a subtle, breathing ember glow (from the original brief).
- No percentage progress bars, productivity scores, failure statistics, red warnings or streak loss.

## Evidence on Hand

- Seed challenges from the original spec: Smart Apartment, Photo Archive Experiment, Love You to Death, Home Server Dashboard (`src/db/seed-data.ts`).
- No real usage statistics, testimonials or user research exist; do not invent them.

## Product Principles

1. Preserve curiosity, don't manage work: nothing should feel like an obligation.
2. Capture must take seconds; everything beyond the idea itself is optional.
3. Rediscovery is the core moment: the backlog is for browsing by eye, and the spark is what makes an old idea recognizable.
4. Every exit is legitimate: completing, returning to the vault and letting go are all normal outcomes.
5. The user's data is theirs: local, exportable, private.
