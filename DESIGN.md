---
name: Challenge Vault
description: A dark specimen cabinet of curiosity, where every idea is a catalogued label you read by eye.
colors:
  shell: "oklch(0.19 0.03 230)"
  background: "oklch(0.225 0.032 222)"
  label: "oklch(0.265 0.03 218)"
  label-hi: "oklch(0.3 0.03 218)"
  popover: "oklch(0.28 0.03 220)"
  foreground: "oklch(0.945 0.012 95)"
  muted-foreground: "oklch(0.79 0.016 215)"
  faint: "oklch(0.69 0.018 215)"
  primary-foreground: "oklch(0.2 0.03 225)"
  rule: "oklch(0.8 0.04 210 / 14%)"
  input: "oklch(0.8 0.04 210 / 20%)"
  cabinet: "oklch(0.8 0.075 200)"
  ember: "oklch(0.81 0.15 70)"
  ember-foreground: "oklch(0.22 0.04 60)"
  jade: "oklch(0.8 0.11 165)"
  jade-foreground: "oklch(0.2 0.03 165)"
  destructive: "oklch(0.72 0.15 28)"
typography:
  headline:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  field-label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.25
  data:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"zero\" 1"
  accession:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"zero\" 1"
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  panel: "0.8rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  panel: "20px"
  panel-wide: "28px"
  section: "40px"
  year: "48px"
components:
  button-cabinet:
    backgroundColor: "{colors.cabinet}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-jade:
    backgroundColor: "{colors.jade}"
    textColor: "{colors.jade-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-default:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-outline:
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-ghost:
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-capture-compact:
    backgroundColor: "{colors.cabinet}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    size: "48px"
  chip-filter:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "32px"
  chip-filter-active:
    backgroundColor: "oklch(0.8 0.075 200 / 15%)"
    textColor: "{colors.foreground}"
  input-search:
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 40px 0 36px"
    height: "40px"
  specimen-label:
    backgroundColor: "{colors.label}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  specimen-label-hover:
    backgroundColor: "{colors.label-hi}"
  catalogued-label:
    backgroundColor: "{colors.label}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "{spacing.panel}"
  ember-panel:
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  dialog:
    backgroundColor: "{colors.popover}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  nav-link:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  nav-link-active:
    backgroundColor: "oklch(1 0 0 / 7%)"
    textColor: "{colors.foreground}"
---

# Design System: Challenge Vault

## Overview

**Creative North Star: "The Specimen Cabinet"**

The vault is a dark collector's cabinet, opened in the evening. Every idea sits in it as a specimen label: an accession number in teal mono, the date it was collected, the spark printed as the label's body, and a ruled strip of measurements at the foot. You read the labels by eye, the way you'd browse a drawer of findings, rather than triaging tickets. The cabinet is quiet slate-teal; the labels are a half-step lighter stock printed in warm off-white ink.

Three state colours do jobs and nothing else. Cabinet teal belongs to the vault itself: accession numbers, selection, filters, the start and capture actions. Ember marks what is under observation and is the only thing that moves at rest, as a slow breathing edge and a pulsing dot. Jade marks what has been catalogued: the completion action, the accession edge on collected labels, and the moment a finished challenge settles into the collection. Density is calm, with labels in an auto-filling grid and generous section gaps. Type is all Inter in sentence case; monospace appears only where something is measured.

The system is dark only (`color-scheme: dark`) and has no light theme.

**Key Characteristics:**
- Dark slate-teal cabinet, with label-stock cards a step lighter, hairline rules instead of heavy borders.
- Three state colours (cabinet, ember, jade), each bound to one meaning.
- Accession numbers (`№ 007`), dates, durations, clocks and counts set in tabular, slashed-zero mono; everything else in Inter.
- Sentence case everywhere: field labels are small and faint, never tracked caps.
- Motion is reserved: ember breathes, catalogued labels settle in, everything else only changes colour.

## Colors

A cool, low-chroma slate-teal ground carrying three saturated state colours that each mean exactly one thing.

### Primary
- **Cabinet Teal** (`cabinet`): the vault's own colour. Accession numbers on backlog labels, the start and capture buttons (filled), active filter chips (15% fill, 60% border), the starred-favourite icon and border (45%), the vault mark, the caret, the text-selection wash (35%) and the focus ring (`--ring` carries the same value).

### Secondary
- **Ember** (`ember`, ink `ember-foreground`): under observation. The active panel's gradient edge and warm under-glow, the pulsing dot in the active strip, the nav count and the status badge, live clocks, accession numbers on active panels, and hover on active titles. Text, dot, edge and glow only.

### Tertiary
- **Jade** (`jade`, ink `jade-foreground`): catalogued. The filled completion button, the 55% top edge and 6% top wash on collected labels, accession numbers and check marks in the collection, the enjoyment scale's selected range, and the ring on a freshly catalogued label.

### Neutral
- **Cabinet Shell** (`shell`): the frame. Sticky header (90%) and mobile bottom nav (95%), both with a background blur, plus the scrollbar track.
- **Cabinet Interior** (`background`): page ground.
- **Label Stock** (`label`): every specimen and catalogued label, plus muted surfaces. **Raised Stock** (`label-hi`) is the hover and expanded state of a label, secondary buttons and the scrollbar thumb.
- **Dialog Stock** (`popover`): dialogs, popovers, menus, and the capture form's sticky footer.
- **Warm Ink** (`foreground`): primary text, plus the fill of the default button. **Muted Ink** (`muted-foreground`) is for descriptions, nav at rest and secondary actions. **Faint Ink** (`faint`) is for field labels, placeholders, meta icons and counts.
- **Hairline** (`rule`, identical to `--border`): every divider, field rule and card stroke. **Input Stroke** (`input`) is slightly stronger, for form fields.
- **Soft Coral** (`destructive`): permanent deletion only, used as text or a 10–20% wash. It is never used for warnings or failure.

### Named Rules
**The One Meaning Rule.** Cabinet means the vault, ember means under observation, jade means catalogued. Never borrow a state colour for decoration or for a different state.

**The Ember Is Observed, Not Pressed Rule.** Ember appears as a glow, edge, dot, clock or text, and never as a button fill. The actions on an active challenge are jade (complete) or neutral. The `ember` button variant exists in `button.tsx`, but nothing ships with it.

**The No Alarm Rule.** No red warnings. The destructive coral is reserved for irreversible deletion, and letting an idea go uses neutral styling.

## Typography

**Display Font:** none. The system has no display face.
**Body Font:** Inter Variable (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace, SFMono-Regular, Menlo, monospace)

**Character:** Inter carries every word in sentence case, tightened at headings. JetBrains Mono is the cabinet's typewriter. It sets measurements only, always with tabular figures and a slashed zero, so numbers line up like a catalogue ledger.

### Hierarchy
- **Headline** (600, 1.5rem rising to 1.875rem at sm on the active panel, tight tracking): page titles and the title of a challenge under observation.
- **Section** (600, 1.125rem, tight tracking): section headings, which are always followed by a faint mono count (`Хранилище 4`), and collection label titles.
- **Title** (600, 17px, 1.375, tight tracking, balanced wrap): specimen label titles in the vault grid.
- **Body** (400, 15px, 1.625): the spark (in «guillemets», 85–90% ink), descriptions, results and the search field. On the active panel, prose is held to 68ch.
- **Body-sm** (400, 14px): buttons, nav, chips, toolbars and meta lines.
- **Label** (400, 12px, faint): field labels (`Начата`, `Потрачено`, `Искра`), tags and hints, in sentence case.
- **Field label** (400, 11px, faint): the measurement strip's field names on specimen labels.
- **Data** (mono, 13px or inherited size, -0.01em, `tnum` + `zero`): dates, durations, clocks, counts, years and keyboard hints. **Accession** is the same face at 500 weight, coloured by state (cabinet, ember or jade).

### Named Rules
**The Measured Mono Rule.** Monospace is used only for things that are measured or numbered: accession numbers, dates, durations, clocks, counts and key names. Never use mono for prose, headings or labels.

**The Sentence Case Rule.** Every label, heading and button is in sentence case at normal tracking. Field names are small and faint, never uppercase or letter-spaced.

## Layout

There is a single centred column capped at 72rem, with 16px gutters (24px from sm). The cabinet-shell header is sticky and 56px tall. Below md (768px), desktop nav gives way to a fixed bottom bar with 56px targets, with the round capture button in the middle where the thumb reaches it. The main column then reserves 6rem plus the safe-area inset at the bottom.

The vault page stacks four bands 40px apart: ember strips for the active challenges (8px apart), the heading with its count, the search-and-filter toolbar (12px gaps; filter chips scroll horizontally on mobile), and the specimen grid. The grid auto-fills columns at least 19rem wide (`minmax(min(100%, 19rem), 1fr)`), with a 16px gap and top alignment so labels keep their natural heights. The collection groups labels by year under a hairline-ruled mono year heading, in two columns from md, with 48px between years. Labels have 16px horizontal padding. The ember panel has 20px padding, rising to 28px from sm.

On coarse pointers, every interactive element has at least a 44px touch target (`pointer-coarse:min-h-11` / `size-11`).

## Elevation & Depth

Depth comes mostly from tonal layering. The shell is darkest, the interior sits a step above it, label stock above that, and raised stock and dialog stock at the top. Shadows are soft, low and cool. They suggest a card resting in a drawer rather than lifting off the page. The one luminous depth effect is ember's warm under-glow, and it belongs to the active state alone.

### Shadow Vocabulary
- **Label rest** (`box-shadow: 0 1px 0 oklch(1 0 0 / 4%) inset, 0 10px 24px -18px oklch(0.05 0.02 230 / 90%)`): every specimen label. It combines a faint top highlight with a tight, cool drop shadow.
- **Ember glow** (`box-shadow: 0 18px 44px -20px oklch(0.81 0.15 70 / 38%)`): ember panels and strips only.
- **Capture float** (`box-shadow: 0 8px 20px -8px oklch(0.05 0.02 230 / 90%)`): the round capture button in the mobile bottom bar.
- **Ember pulse** (`0 0 0 0 → 0 0 0 5px`, ember 55% → 0%): the ember dot's halo.

### Named Rules
**The Only Ember Glows Rule.** Glow is warm and reserved for what is under observation. No other state, button or card gets a coloured shadow.

## Shapes

Corners are gently rounded on a 0.5rem base. Labels use 0.5rem, buttons and nav items 0.4rem, dialogs 0.7rem, and the ember panel is softer at 0.8rem. Filter chips, reason chips, the enjoyment bars' segments, ember dots and the mobile capture button are fully round. Strokes are 1px hairlines at 14% (`rule`). Inside a label, the measurement strip is a row of fields ruled above and below and divided by vertical hairlines. Empty states reuse the label shape with a dashed stroke. The vault mark is a rounded square containing a ringed circle and four ticks, stroked in cabinet teal.

## Components

### Buttons
Quiet and compact. The filled colour tells you which state the action moves the idea into.
- **Shape:** gently rounded (0.4rem). Heights are 36px by default, 28px for sm, 40px for lg, and 44px minimum on touch.
- **Cabinet (primary):** a cabinet-teal fill with dark ink. Used for "Начать" (start), the capture button ("+ Поймать") and the capture form's save.
- **Jade:** a jade fill with dark jade ink. Used only for "Завершить" (complete) and the post-completion "Открыть коллекцию".
- **Default:** warm ink fill with dark ink, for neutral dialog submits.
- **Outline / Ghost:** an input-stroke outline over a 30% input wash, or text-only muted ink. Used for secondary actions such as set aside, add note, filters and shuffle.
- **Hover / Focus:** filled variants drop to 88% on hover. Focus shows the ring colour as the border plus a 3px ring at 40–50%. Buttons press down 1px when active. Disabled buttons sit at 50% opacity.
- **Text links:** "Открыть →" is muted ink that turns to warm ink and gains an underline on hover. The arrow is a Lucide icon.

### Chips
- **Filter chips:** fully round, 32px tall, a hairline stroke and muted ink. When active they take a cabinet tint (15% fill, 60% stroke) with warm ink. On hover the stroke rises to 25% white and the ink to warm.
- **Reason chips** (letting go): the same shape. Selected chips use a 40% warm-ink stroke over a 10% white wash.
- **Tags:** plain 12px text rather than pills. The category is set at 500 weight in 85% ink, and tags appear as `#tag` in muted ink.

### Cards / Containers
- **Specimen label:** label stock, a hairline stroke, 0.5rem corners and the label rest shadow. The header row holds the accession number (cabinet mono) and the collection age (faint), with the star on the right. Below come the title, the spark as body text (clamped to four lines), and a footer containing the measurement strip (`Время / Где / Деньги`, printing only known fields), a faint "изучалась" line when relevant, and the tags. The whole label is a disclosure. Hover and expanded states raise it to Raised Stock with a 20% white stroke over 200ms. The expanded region grows open over 250ms ease-out and reveals start and open. A starred label carries a cabinet stroke at 45%.
- **Catalogued label:** label stock with a jade top edge at 55% and a 6% jade wash fading out by 45%. It has a jade accession number and a check with the date, the title (turning jade on hover), the result, the spark, a ruled metric row (`Потрачено`, `Интерес` with a 10-segment jade bar and mono score), and tags.
- **Ember panel** (the active page): a vertical gradient from slightly raised teal to label stock, a 40% ember stroke, a 1px ember gradient border that breathes from 50% to 100% opacity over 6s, and the ember glow. Its contents are separated by hairline-ruled field rows.

### Inputs / Fields
- **Style:** a 1px input stroke over a 30% input wash with 0.5rem corners. The vault search is 40px tall, uses 0.4rem corners over 70% label stock, and has a leading search icon and a trailing `/` key hint in mono.
- **Focus:** the border shifts to the ring colour (cabinet) with a 3px ring at 50%.
- **Error:** a coral border and ring, with 12px coral helper text written as a suggestion ("Попробуй так: …"), never as a reprimand.

### Navigation
- **Desktop header:** the cabinet shell at 90% with a blur and a hairline bottom. It holds the vault mark with "Challenge Vault" (15px, 600), then 36px nav items in body-sm 500. Items are muted at rest and warm on hover. The current item gets a 7% white wash. "Сейчас" carries a pulsing ember dot and a mono count. Data and logout are 36px icon buttons, followed by the cabinet capture button.
- **Mobile bottom bar:** the shell at 95% with a blur and a hairline top. It shows four icon-over-label items (12px, 500); the current item has warm ink with a cabinet icon. The 48px round capture button sits in the centre.

### Ember Strip (signature)
This is the vault's first band: one slim ember panel per active challenge. It contains a pulsing ember dot, the title (600, truncated, turning ember on hover) with a faint mono accession number, a one-line "С чего продолжить" resume, the live clock in ember mono, and a 36px open arrow.

### Catalogue Moment (signature)
Completing a challenge opens a dialog to record what came of it, how interesting it was and how long it took. Interest is a 1–10 radiogroup of mono cells (five columns on mobile, ten from sm). The cells up to the chosen value take a jade tint, and the chosen cell is stronger. When the form is submitted, the dialog shows the resulting catalogued label settling in (`catalogue-in`, 420ms, `cubic-bezier(0.16, 1, 0.3, 1)`, rising 6px from 98.5% scale with a 90% jade border). It offers jade "Открыть коллекцию", and the new label appears in the collection ringed in jade at 60%.

## Do's and Don'ts

### Do:
- **Do** set every idea as a specimen label: accession number, collection age, title, spark as the body, and a ruled measurement strip that prints only the fields that are known.
- **Do** bind each state colour to its meaning: cabinet for the vault and its actions, ember for under observation, jade for catalogued.
- **Do** put accession numbers, dates, durations, clocks and counts in the mono data face with tabular, slashed-zero figures.
- **Do** separate fields with 14% hairlines and use tonal steps (shell, interior, label stock, raised stock) for depth.
- **Do** keep touch targets at least 44px on coarse pointers, and put capture in thumb reach on mobile.
- **Do** honour `prefers-reduced-motion`: stop the ember breathing and pulse, and collapse `catalogue-in` to 1ms.
- **Do** pair Lucide icons with text, or with an accessible label when an icon stands alone.

### Don't:
- **Don't** use tracked uppercase kickers or eyebrows above headings. Field names are small, faint and in sentence case.
- **Don't** fill a button with ember or give anything other than an ember panel a coloured glow.
- **Don't** use monospace for prose, headings or labels.
- **Don't** turn tags into coloured pills. Tags stay as plain text, with the category slightly stronger.
- **Don't** add percentage progress bars, scores, streak indicators or red warnings. The bars that do appear (the 10-segment interest scale and the per-topic hours in the vault stats) compare quantities and never show progress toward a goal.
- **Don't** use emoji as icons.
- **Don't** introduce a light theme or a second accent hue outside the three state colours.
