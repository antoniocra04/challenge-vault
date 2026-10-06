---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Surface brief: Challenge Vault app (all routes)

Scope: whole app shell and routes — ideas (/), in progress (/active), done (/completed), archive (/archive), idea detail, data, login. Visitor mode: Operate, with a browsing moment on the ideas page.

Job: open the app in free time, scan many ideas quickly, pick one, start it, keep short notes, finish it or put it back. Success: an old idea is recognised at a glance and started.

Constraints: UI in short, plain Russian (rewrite all copy, no literary lines); no feature or flow removed; dark first; no telemetry or external assets. Build path: code-led (no image generation). The previous specimen-collection world and its copy were rejected by the user as AI slop and are anti-reference only.

## Direction contract

THESIS: Browsing ideas is reading a contact sheet: many small frames at once, and you circle the one worth doing in red grease pencil. Refuses the category default of rounded SaaS cards with an accent glow, and the previous metaphor costume (numbers, "catalogued", glowing panels).

OWN-WORLD: Darkroom neutrals: near-black sheet with a darker shell, frames in dark greys with light text, dense tight grid. The only saturated colour is china-marker red, used for one job: what is in progress (the circle, the active dot, the in-progress nav count). Done items are "prints": a paper-white border. Archived items are dimmed. Inter for everything, a real type scale, tabular figures; no monospace costume, no emoji, Lucide icons.

STORY: The visitor sees the circled frames they are working on, then a dense sheet of ideas, each frame showing title and why it was wanted; they open one, start it (a red circle is drawn round it), and later it becomes a print in "Сделано".

FIRST VIEWPORT: Black shell header with name, standard nav (Идеи, В работе, Сделано, Архив) and a white "Добавить" button (bottom bar with add button on phones). Under it, in-progress ideas as wide frames circled in red, then the "Идеи" heading with count, search, filters, sort, shuffle, and a dense grid of frames starting inside the first viewport.

FORM: Contact sheet with grease-pencil selection; position 1 of my ordered list (the pick card, chosen by the user over the assigned bookshelf); seed key f9ef55e6. Signature move: starting an idea draws a hand-drawn red grease-pencil circle round it; opening a frame enlarges it in place across two columns. Adaptation (cited): the circle wraps the idea's title rather than the whole frame, because a loop stretched over a wide strip flattened into two straight strokes in the first inspection round; each idea gets its own seeded loop.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
