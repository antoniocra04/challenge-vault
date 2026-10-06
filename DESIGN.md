---
name: Challenge Vault
description: A contact sheet of ideas in darkroom greys; what you are doing is circled in red grease pencil.
colors:
  shell: "oklch(0.13 0 0)"
  background: "oklch(0.16 0.002 90)"
  underexposed: "oklch(0.19 0.002 90)"
  label: "oklch(0.215 0.002 90)"
  popover: "oklch(0.22 0.002 90)"
  label-hi: "oklch(0.25 0.002 90)"
  foreground: "oklch(0.95 0.004 90)"
  muted-foreground: "oklch(0.79 0.006 90)"
  faint: "oklch(0.69 0.008 90)"
  destructive: "oklch(0.88 0.006 90)"
  rule: "oklch(1 0 0 / 10%)"
  input: "oklch(1 0 0 / 16%)"
  ring: "oklch(0.95 0.004 90 / 70%)"
  marker: "oklch(0.7 0.19 28)"
  print: "oklch(0.92 0.008 90)"
typography:
  display:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.11
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  body-reading:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
  data:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "inherit"
    fontFeature: "tnum"
rounded:
  print: "2px"
  control: "3.2px"
  frame: "4px"
  dialog: "5.6px"
  pill: "9999px"
spacing:
  sheet-gap: "6px"
  frame-pad: "12px"
  frame-pad-wide: "16px"
  gutter: "16px"
  gutter-wide: "24px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  frame:
    backgroundColor: "{colors.label}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.frame}"
    padding: "{spacing.frame-pad}"
  frame-open:
    backgroundColor: "{colors.label-hi}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.frame}"
    padding: "{spacing.frame-pad-wide}"
  print:
    backgroundColor: "{colors.label}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.print}"
    padding: "16px"
  underexposed:
    backgroundColor: "{colors.underexposed}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.frame}"
    padding: "12px 16px"
  chip-filter:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
  chip-filter-active:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.frame}"
    padding: "4px 10px"
    height: "32px"
  nav-link-active:
    backgroundColor: "oklch(1 0 0 / 10%)"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.frame}"
    padding: "0 12px"
    height: "36px"
---

# Design System: Challenge Vault

## Overview

**Creative North Star: "The Contact Sheet"**

Browsing ideas is like reading a contact sheet: lots of small frames on a near-black sheet, all visible at once, and the one you are working on is circled in red grease pencil. The system is dark only. It uses neutral darkroom greys with almost no chroma, a tight grid of frames with 6px gutters, and one font, Inter, set on a real size scale. Density is the point: in the first viewport you see the circled work in progress, then a sheet of ideas that already starts above the fold.

State is shown with photographic materials, not badges or glow. In-progress work gets a red grease-pencil loop, done work becomes a print with a paper-white border, and archived work is underexposed (darker and dimmer). Nothing has a shadow. Depth comes from steps of grey, and the darker shell (the header and bottom bar) frames the sheet.

The world rejects two things: the category default of rounded SaaS cards with an accent glow, and the previous "specimen collection" costume (accession numbers, catalogue language, glowing teal panels, literary microcopy). The user named that costume AI slop.

**Key Characteristics:**
- Neutral darkroom greys (chroma at most 0.008, hue 90) on a darker shell.
- A dense, flat grid of frames (2, 3, 4 or 5 columns) with a 6px gap.
- One saturated colour, the red marker, and it has one job: in progress.
- Done items are prints with a 2px paper-white border; the archive is underexposed.
- A backlog frame opens in place across two columns. It does not open a modal or a new page.
- Inter for everything. Numbers use tabular figures; there is no monospace face.

## Colors

The palette is a darkroom: warm-neutral greys stepped by lightness only, plus one china-marker red and one paper white.

### Primary
- **China-Marker Red** (marker): the red grease-pencil loop around an in-progress title, the pulsing timer dot, the "В работе" status text and dot, and the in-progress count in the nav (a red dot on the bottom bar). It never appears as a fill, a button or a decoration.

### Secondary
- **Paper White** (print): the 2px border of a done item (a print) and the dot of the "Сделано" status. It always means done.

### Neutral
- **Shell Black** (shell): the sticky header and the mobile bottom bar. This is the darkest surface, and it frames the sheet.
- **Sheet** (background): the page ground. It is also the text colour on light fills (primary button, active chip).
- **Underexposed Grey** (underexposed): the ground of archived rows, darker than a frame so that archived items step back.
- **Frame Grey** (label): every frame on the sheet, the ground of prints, and detail panels.
- **Popover Grey** (popover): dialogs, menus and popovers, one step above a frame.
- **Lifted Frame Grey** (label-hi): frame hover and opened frames; secondary and accent fills.
- **Highlight White** (foreground): primary text and the primary button fill.
- **Muted Grey** (muted-foreground): secondary text such as the lead line under a frame title, meta lines and inactive nav.
- **Faint Grey** (faint): field labels, tags, placeholders and timestamps. It is the lowest text tier and still legible on Frame Grey.
- **Pale Warning** (destructive): destructive and invalid states use a pale neutral, not red, so that red keeps its one job.
- **Rule** (rule / border, white at 10%), **Input Stroke** (input, white at 16%), **Focus Ring** (ring, Highlight White at 70%).

### Named Rules
**The One Job Rule.** Red marks what is in progress and nothing else: the loop, the timer dot, the in-progress status and count. Errors, deletion, emphasis, links and celebrations never use red.

**The Darkroom Rule.** Neutrals carry no hue accent. Steps between surfaces are steps of lightness (shell 0.13, background 0.16, underexposed 0.19, frame 0.215, popover 0.22, frame-hi 0.25). Do not tint a surface to give it meaning.

## Typography

**Display Font:** Inter Variable (with ui-sans-serif, system-ui)
**Body Font:** Inter Variable
**Label/Mono Font:** none. Figures use Inter with tabular numerals.

**Character:** This is one plain, well-set sans in a few weights (400, 500, 600). Headings are tight-tracked semibold; everything else is quiet. Hierarchy comes from size and grey tier, not from typeface contrast.

### Hierarchy
- **Display** (600, 30px on phones / 36px from 640px, tight): the title of an idea on its detail page, and the only place the loop is drawn at this size.
- **Headline** (600, 24px, tight): page headings ("Идеи", "Сделано", "Архив") followed by a count; also the in-progress title on /active (24px / 30px).
- **Title** (600, 14px on phones / 15px from 640px, tight, balanced wrap): frame titles on the sheet. An opened frame steps up to 18px / 20px.
- **Body reading** (400, 17px, 1.625, max 68ch): description and "Почему захотелось" on the detail page.
- **Body** (400, 14px): frame lead lines (13px on phones), notes, controls and lists.
- **Label** (400, 12px, Faint Grey): field labels above values (dt), tags, and meta lines joined with " · ".

### Named Rules
**The Tabular Figures Rule.** Every number (durations, counts, dates, years, scores, shortcuts) is set with tabular figures (`font-variant-numeric: tabular-nums`) in Inter, so that columns line up. Do not switch to a monospace face for data. A `--font-mono` stack is declared in the theme but is never applied.

## Layout

The sheet sits in a centred container (max 1152px) with gutters of 16px on phones and 24px from 640px. The ideas grid packs densely with a 6px gap: 2 columns on phones, 3 from 640px, 4 from 1024px and 5 from 1280px. Frames align to the top and are as tall as their content (min 128px), with 12px padding (16px from 640px). Sections on the ideas page are 40px apart. In-progress strips sit above the sheet in a single column with 16px gaps.

Done prints use a looser grid: 1, 2 or 3 columns with 16px gaps, grouped under a year heading. The archive is a single column of rows with 8px gaps. The detail page is one column on phones (title, actions, content, details) and splits from 1024px into content plus a 20rem side column with a 48px gap.

Navigation moves by breakpoint. From 768px the header carries the nav links and an "Добавить" button. Below 768px a fixed bottom bar in Shell Black holds four tabs and a round add button in the middle, and the main area reserves 6rem of bottom padding for it. Touch targets grow to 44px on coarse pointers (`pointer-coarse`).

### Named Rules
**The Enlarge-in-Place Rule.** Opening a backlog frame widens it across two columns in its own spot on the sheet, lifts it to Lifted Frame Grey and shows its actions and details. The grid packs densely around it. A frame never opens in a modal or drawer.

## Elevation & Depth

The system is flat. No surface has a box-shadow. Depth comes from lightness steps (Shell, then Sheet, then Underexposed, then Frame, then Popover, then Lifted Frame), from 10% white hairline rules, and for dialogs from a 1px Highlight White ring at 10%. Hover lifts a frame by colour (Frame Grey to Lifted Frame Grey over 150ms), never by elevation.

### Named Rules
**The Flat Sheet Rule.** Frames lie flat on the sheet. State shows through material (loop, paper border, underexposure) and grey tier, never through a shadow or glow.

## Shapes

Corners are barely softened. Frames and inputs use 4px, buttons 3.2px, dialogs 5.6px, and prints a crisper 2px. Pills (filter chips, the "Отложить" reason chips, the mobile add button) are fully round. The only free-form shape is the hand-drawn marker loop.

## Components

### Buttons
Plain and compact.
- **Shape:** gently squared (3.2px), 36px high, 44px minimum on touch.
- **Primary:** Highlight White fill with Sheet text, 14px medium, used for "Начать", "Завершить" and "Добавить". Hover drops to 80% opacity, and pressing nudges the button down 1px.
- **Outline / Secondary:** a hairline Rule border on a 30% Input fill, or a Lifted Frame Grey fill.
- **Ghost / text links:** Muted Grey text that turns Highlight White on hover. Icon links are 36px squares with a 5% white hover wash.
- **Focus:** a 2px Focus Ring outline with a 2px offset, applied globally.

### Chips
- **Style:** filter chips are 32px pills with a hairline Rule border and Muted Grey text. Hover raises the border to 30% white.
- **State:** the active chip is filled Highlight White with Sheet text. Tags are not chips: they are plain 12px Faint Grey text with a `#` prefix, and the category is shown in Muted Grey.

### Cards / Containers
- **Frame:** Frame Grey, 4px corners, no border, no shadow, 12–16px padding. On the sheet a frame shows only a title, two clamped lead lines and an optional star.
- **Print (done):** Frame Grey with a 2px Paper White border and 2px corners. It is used for done items and for the "Результат" block on a done idea's detail page.
- **Underexposed (archived):** the darker Underexposed Grey ground, with titles in Muted Grey and meta in Faint Grey.
- **Internal dividers:** 10% white hairline rules.

### Inputs / Fields
- **Style:** a 16% white stroke on a 30% Input fill, 4px corners, 32px high, with placeholders in Faint Grey. Placeholders give a concrete example in the form "Например: …".
- **Focus:** the stroke shifts to Focus Ring, plus a 3px Focus Ring wash at 50%.
- **Error:** a Pale Warning stroke and wash. Never red.

### Navigation
- **Header:** sticky, Shell Black, 56px high, with a bottom hairline. The links are 14px medium; the active link sits on a 10% white wash and the others are Muted Grey. "В работе" carries its count in China-Marker Red.
- **Mobile:** a fixed bottom bar with 20px Lucide icons over 12px labels and a round 48px Highlight White add button in the middle. "В работе" gets a red dot while anything is in progress.

### Marker Loop (signature)
This is a red grease-pencil loop drawn around the title of an in-progress idea, never around a whole frame or strip. It is sized to the measured line box of the title. The shape is a superellipse (exponent 2.3), wide enough that the corners of the ink sit inside. It is tilted 1.5–3°, has a low-frequency wobble that never pulls inward, and ends open, overshooting its start. A seed from the idea's id keeps each idea's loop stable. The stroke is 3.5px with round caps, plus a 1.6px echo stroke at 45% opacity offset by about 1px. The loop is clamped so that the drawn stroke stays at least 8px from the screen edge. It draws itself once over 520ms (cubic-bezier(0.22, 1, 0.36, 1)); the timer dot pulses on a 2.4s cycle; both are disabled under reduced motion.

## Do's and Don'ts

### Do:
- **Do** circle in-progress titles with the marker loop, measured to the title. Give the loop a seed so it is the same on every visit.
- **Do** show done items as prints (2px Paper White border) and archived items as underexposed rows.
- **Do** keep the sheet dense: 6px gaps, frames as tall as their content, and the grid starting inside the first viewport.
- **Do** open backlog frames in place across two columns.
- **Do** set every number with tabular figures in Inter.
- **Do** separate surfaces by lightness steps and 10% white hairlines.

### Don't:
- **Don't** use red for anything other than in progress. That includes errors, delete actions, links, highlights and "just finished".
- **Don't** stretch the loop around a wide strip or a whole frame; it flattens into two straight strokes.
- **Don't** add shadows, glows or tinted accent panels to frames.
- **Don't** bring back the specimen-collection costume (accession numbers, catalogue language, teal and ember accents, glowing panels).
- **Don't** set data in a monospace face, and don't use emoji or glyph icons; icons are Lucide SVG.
- **Don't** use the Paper White border on anything that is not done.
