---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: Challenge Vault app (all routes)

Scope: whole app shell and routes — vault (/), active (/active), collection (/completed), archive (/archive), challenge detail, data, login. Visitor mode: Operate, with a browsing/rediscovery moment on the vault.

Job: open the vault in free time, browse ideas by eye until one sparks, start it, keep notes, and finish by completing, returning to the vault, or letting go. Success: an old idea is recognized from its spark and the user goes to do it.

Constraints: UI copy in Russian, voice preserved from the incumbent English copy; ember glow on active kept; no feature or flow removed; dark mode first; no telemetry or external assets. Build path: code-led (no image generation available).

Inputs: critique snapshot .impeccable/critique/2026-10-06T06-14-14Z__src-app.md (26/40) — all priority issues in scope.

## Direction contract

THESIS: The vault is a specimen collection of curiosity. Every idea is a catalogued specimen with an accession number and a label you read, not a ticket in a grid. Refuses the category default: uniform tag-led SaaS cards, tracked-caps kickers, metric heroes, neon-on-black glow.

OWN-WORLD: Specimen-cabinet slate-teal ground and darker cabinet shell; label-stock cards in warm off-white ink with hairline field rules; three state colours doing jobs — cabinet teal for the vault and accession numbers, ember for "under observation" (active, breathing glow), jade for "catalogued" (completed). Inter for all UI, sentence case; JetBrains Mono only for data: accession №, dates, durations, clocks, counts. Lucide icons with text, no emoji.

STORY: The visitor sees what they are exploring right now in one slim ember strip, then browses specimen labels led by each idea's spark, filters by context if they like, starts one, and later files the result into a collection of catalogued findings.

FIRST VIEWPORT: Cabinet-shell header (mark, nav, + Поймать) on desktop; on mobile a single-row header plus bottom nav with the capture button in thumb reach. Under it, one ember strip per active challenge (clock, title, where to continue, open). Then the vault heading with count, search, filters, sort and shuffle, then the specimen-label grid starting within the first viewport.

FORM: Pinned by the user ("Lab / terminal" translated into a specimen collection under operate-mode rules); user-pinned direction, no concept-seed roll. Signature move: the specimen label — accession number, collected date, spark as the label's body, a ruled field strip of measurements — and the moment a completed challenge is catalogued into the collection.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
