# Miriam — Design System

The single reference for how Miriam looks, moves, and sounds. Everything here is
implemented in `app/globals.css` (tokens) and `app/components/hero/` (parts). If a
value is not a token yet, add the token rather than hard-coding it.

## The idea

Miriam is an always-on financial agent for Nigerian businesses. The hero states it
by contrast: real, scuffed, everyday commerce photographed as physical die-cut
stickers, piled loosely around typography that is calm, tight and expensive.

**Mess is the subject. Order is the product.** The stickers are the mess; the type
is the financial layer sitting above it. Never explain that metaphor in the UI.

## Brand

- Wordmark: "Miriam", Instrument Sans 600 at -0.025em, with the bar-chart mark in
  a rounded square. The mark recolours with the theme (`currentColor` on a
  `--ink` field).
- **Sticker photography is the brand asset.** Photorealistic Nigerian commerce,
  isolated on a die-cut white border, is as much the visual identity as the
  wordmark. Treat new stickers as a brand deliverable, not as decoration.
- Voice: dry, direct, confident. Sentence case. No exclamation marks, no hype
  adjectives, no exclamation-level copy in the hero.

## Colour

Warm paper, never clinical white. Dark theme is a warm near-black, not grey.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#F7F5F0` | `#14130F` | Page and hero field |
| `--paper` | `#FBFAF7` | `#1A1915` | Raised surfaces |
| `--ink` | `#111111` | `#F3F0E9` | Headline, primary fill |
| `--soft-ink` | `#353432` | `#CDC8BE` | Nav links, secondary text |
| `--muted` | `#686663` | `#9A958C` | Subheadline, body |
| `--button` / `--button-text` | `#111111` / `#FFFFFF` | `#F3F0E9` / `#14130F` | CTA pair |
| `--hairline` | `rgba(17,17,17,.14)` | `rgba(243,240,233,.18)` | 1px control borders |
| `--noise-opacity` | `.05` | `.03` | Paper grain overlay |

Rules: one accent does not exist — the photography supplies the colour. The
background carries an SVG noise overlay at `--noise-opacity` so it reads as paper
rather than as a flat fill. No gradients as decoration, no purple, no neon, no
glass, no glow.

Theming: `html[data-theme]` is set by an inline script in `app/layout.tsx` before
first paint (stored preference, else system), so there is no flash. `color-scheme`
follows the theme. `ThemeToggle` writes `localStorage.theme`.

## Typography

Instrument Sans, loaded through `next/font` as `--font-instrument-sans`, weights
400/500/600. Fallbacks: Manrope, then system UI.

| Role | Size | Weight | Tracking | Leading |
| --- | --- | --- | --- | --- |
| Hero headline | `clamp(38px, 4.5vw, 68px)` | 500 | -0.045em | 1 |
| Subheadline | `clamp(15px, 1.15vw, 18px)` | 400 | -0.005em | 1.4 |
| Section heading | `clamp(22px, 2.4vw, 34px)` | 500 | -0.035em | 1.12 |
| Nav link | 13px | 500 | -0.005em | — |
| CTA | 14px | 600 | -0.01em | — |
| Mobile menu link | 24px | 500 | -0.035em | 1.2 |

The headline spans as much of the viewport as it can, and its **line breaks are
authored, not left to the browser**. Above 1100px it is a single line across the
content column (about 79% of the viewport). Between 640px and 1100px it becomes
"Your business has enough / to worry about.", and phones read "Your business has /
enough to worry about." — `.breakWideScreen` and `.breakNarrowScreen` trade places.
Keep the longest line filling the column; never let the type sit narrower than about
half the viewport on desktop.

## Layout

| Token | Value |
| --- | --- |
| `--gutter` | `clamp(18px, 2.4vw, 36px)` |
| `--header-h` | `clamp(58px, 5.4vw, 78px)` |
| `--content-width` | `min(1240px, 88vw)` (tablet `min(760px, 88vw)`, phone `100vw - 40px`) |
| `--content-top` | `45%` (phone `44%`) |

The hero is `min-height: 100svh` and owns the first viewport. Spacing scale is the
clamp family above; radii are `999px` for pills and controls, 7px for the mark.

## Sticker system

Specification for any new sticker:

- One object, full silhouette, no crop, rotated between -15° and +15°.
- Photorealistic editorial product photography, 50–85mm equivalent, upper-left soft
  large-source light, gentle fill, visible material imperfections.
- Die-cut white border proportional to the object, with a subtle soft contact
  shadow (`drop-shadow`), never a rectangular box behind the asset.
- Fully transparent background. Exported at 800px on the long edge, WebP quality 86,
  trimmed to the alpha bounds, and saved as `public/assets/sticker-<name>.webp`.
- Every sticker shares the same lighting, border and shadow language so the pile
  reads as one collection.

Placement, physics and repeats all live in `app/lib/stickers/config.ts`:
`BASE_STICKERS` is the authored set; `buildRepeats` derives second copies across the
lower band on a seeded grid (deterministic across resizes). Copies take `layer: 4`
so they always sit behind the base objects and never paint over a hero human's face.

## Sections

**Hero** — `app/components/hero/`. One viewport tall, the sticker pile behind a
single line of type with an invisible safe zone keeping the pile off the copy.

**Problem** — `app/components/problem/`. One viewport tall and never taller: the
copy length, the type scale (`min(6vw, 10.6svh)`) and the sticker sizes are set
together so the section always fits the screen at every ratio, verified from 390×844
to 1920×1080. The label sits at the top of the viewport and the statement runs down to
the bottom, with `justify-content: space-between` absorbing whatever height the line
count leaves over. It is the one section that is **light in both themes** — the
daylight counterpart to the hero — with the same paper, dark copy and a single
statement spanning the full width minus the gutter.

Its four stickers live in `app/lib/stickers/scatter.ts`. They share one size —
`SCATTER_SIZE`, the longest edge, with each box following its own aspect ratio — and
fall into the section from above its top edge, so they read as stickers dropping out
of the hero as you scroll. They carry `z-index: 2` so they sit **over** the copy and
deliberately hang over the section edge and into the type, the way the hero's pile
does; keep them off the middle of a line so the words still read. Phones keep three.

The copy is deliberately plain: short sentences, everyday words, no finance jargon,
because this section has to land with a shop owner as much as an investor.

## Motion

| Moment | Behaviour |
| --- | --- |
| Load | Background, then header (100ms), headline (150ms), subline (250ms), CTA (350ms) |
| Entrance | Every sticker **falls from above the viewport** into place, accelerating then landing with a small overshoot. Heavier stickers land first; 30ms stagger |
| Idle | 95% static. Every 5–8s, one or two light stickers drift 1–2px and 0.5–1° over 1–2s |
| Hover | +2–4% scale, a slight lean toward the pointer, deeper shadow, 220ms |
| Passing cursor | A pointer within ~20% of the short edge pushes the pile away and never the other way: `(1 - d/reach)^1.5`, divided by `sqrt(mass)`, so paper flies and a carton barely shifts. Poking is enough to play — dragging is optional. The pile keeps its safe zone, so it scatters into the empty paper rather than over the headline |
| Poking the problem section | Those four stickers ease aside up to 52px and return to rest when the pointer leaves |
| Grab | +3–6% scale, 4–6px lift, strongest shadow, cursor becomes grabbing |
| Release | Momentum from the last ~110ms of pointer movement, scaled down by mass |
| Collision | Soft: momentum transfer plus a small rotation, restitution 0.15–0.30 |
| Boundaries | Stickers may hang 24–36px past an edge and settle back, never leaving |
| Device tilt | `deviceorientation` becomes a real gravity vector; stickers slide toward the tilt. A steady tilt stops feeding force after 1.2s so the pile settles |
| Scroll | Interaction fades out between 10% and 30% of the hero; positions persist |
| Reduced motion | Physics, entrance, idle drift and hover movement all off; the static composition must still look finished |

Easing is `cubic-bezier(.22, 1, .36, 1)` everywhere unless a moment needs a fall
(`cubic-bezier(.45,.05,.75,.6)`) or an impact (`cubic-bezier(.2,1.4,.4,1)`).
Continuous motion is `transform: translate3d()` + `rotate()` only, driven by one
`requestAnimationFrame` loop that sleeps when everything is at rest.

## Sound — parked

Interaction sound is switched off for now: no cues play on stickers, text or buttons,
and cuelume is not a dependency. If it comes back, this is the contract to restore.

Use cuelume's declarative attributes by job, so the element says what it does and
cuelume's delegated listeners pick it up:

| Attribute | Put it on | Cue |
| --- | --- | --- |
| `data-cuelume-tap` | Anything the user activates: buttons, CTA links, icon buttons | `tap` |
| `data-cuelume-select` | Choosing one of several: dropdowns, lists, tabs, segmented controls, radios | `select` |
| `data-cuelume-type` | Text fields, textareas, search | `type` |
| `data-cuelume-toggle` | Two-state controls: checkboxes, theme and sound buttons | `toggle` |
| `data-cuelume-open` / `data-cuelume-close` | Disclosures with both directions: menus, drawers, accordions | `open` / `close` |
| `data-cuelume-navigate` | Links and controls that move to another page or section | `navigate` |
| `data-cuelume-emphasis` | On the element or any ancestor: `subtle`, `normal`, `strong` | weights the cue |

`play()` is only for moments with no click to bind: a drag picked up or dropped
(`select` / `tap` strong), a drag cancelled (`close`, subtle), or a keyboard
dismissal (`close`). Never sound hover, a collision, or anything that fires in
bursts. If a sound toggle returns, give the user the switch and persist it, and
remember that switching sound *on* cannot use the binding: playback is still off at
the instant that click is handled, so it plays explicitly after the preference
flips.
