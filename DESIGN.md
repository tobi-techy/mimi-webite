# Mimi — design system

The reference for how the Mimi marketing site looks, moves and reads. It is a
faithful port of the `mimi-web` prototype: same copy, same sections, same order.
Tokens live in `app/globals.css` via Tailwind v4 `@theme`; components live in
`app/components/`. If a value is not a token yet, add the token rather than
hard-coding a colour in a component.

## The idea

Mimi is an always-on shop helper that lives in WhatsApp. The site states it by
contrast: real, everyday Nigerian commerce photographed as physical die-cut
stickers, piled loosely around typography that is calm, tight and expensive.

**Mess is the subject. Order is the product.** The stickers are the mess; the
type is the financial layer above it. Never explain that metaphor in the UI.

## Brand

- Wordmark: the brand-kit SVG (`public/brand/wordmark/mimi-wordmark-primary.svg`),
  used big in the footer and inverted with `filter: invert(1); mix-blend-mode:
  lighten` in dark mode.
- Header uses the reverse logo SVG on the solid pill; the mobile menu uses the
  primary logo.
- **Sticker photography is the brand asset.** New stickers are a brand
  deliverable, not decoration.
- Voice: dry, direct, confident. Sentence case. No exclamation marks, no hype.

## Colour

Warm paper, never clinical white. Dark theme is a warm near-black. The only
values live in `:root` (light) and `:root[data-theme="dark"]`; everything else
references them through the Tailwind tokens in `@theme inline`.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--surface` | `#F7F5F0` | `#14130F` | Page sheet |
| `--outer` | `#ECE8DF` | `#0E0D0A` | Field behind the sheet |
| `--paper` | `#FBFAF7` | `#1A1915` | Raised surfaces, chat cards |
| `--tint` / `--tint2` | `#EFECE5` / `#F1EEE7` | `#201F1A` / `#232218` | Tiles, panels, pills |
| `--ink` | `#111111` | `#F3F0E9` | Headings, solid fills |
| `--soft` | `#353432` | `#DDD8CF` | Secondary text |
| `--muted` | `#686663` | `#9A958C` | Body, labels |
| `--hairline` | `rgba(17,17,17,.14)` | `rgba(243,240,233,.16)` | 1px borders |

Constants that never follow the theme: `--solid` `#111111` (nav pill), `--cream`
`#F3F0E9` (cream-on-ink controls), `--faint` `#A9A6A0` and `--faint-2` `#B7B4AD`
(de-emphasised statement copy, inert dots).

Rules: no gradients, no purple, no glassmorphism, no accent colour. The
photography supplies the colour. A fixed SVG grain sits over the page at
`--noise-opacity` (`.grain`). Theming: an inline script in `app/layout.tsx` sets
`html[data-theme]` before first paint (stored `mimi-theme`, else system).
`ThemeToggle` in `SiteHeader` writes `localStorage.mimi-theme`.

## Typography

Instrument Sans (400/500/600) and DM Mono (400/500), loaded through
`next/font/google` as `--font-instrument-sans` / `--font-dm-mono` and wired to
`font-sans` / `font-mono`. DM Mono is only for labels, numbers, times and
`contents` lists (`text-[11px] uppercase tracking-[0.08em]`).

| Role | Size | Weight | Tracking | Leading |
| --- | --- | --- | --- | --- |
| Hero h1 | `clamp(38px, 6.4vw, 84px)` | 500 | -0.045em | 1 |
| Section h2 | `clamp(28px, 3.4vw, 52px)` | 500 | -0.035em | 1.02 |
| Tile heading (`.tile-big`) | `clamp(24px, 2.5vw, 36px)` | 500 | -0.035em | 1.05 |
| Statement | `clamp(26px, 3.3vw, 46px)` | 500 | -0.035em | 1.14 |
| Crossed-out list | `clamp(40px, 6.4vw, 88px)` | 500 | -0.045em | 1.08 |
| Body / sub | 17px | 400 | -0.005em | 1.55 |
| Legal doc h2 | `clamp(22px, 2vw, 28px)` | 500 | -0.03em | 1.2 |
| Legal doc body | 16px | 400 | — | 1.65 |

## Layout

- Shell: `.sheet` (max 1440px, 10px pad) wraps `.inner` (rounded 34px, surface,
  `overflow: clip`). The header, `<main>` and footer all live inside it.
- Section rhythm: `.section` gives `padding-top: clamp(56px, 8vw, 110px)` and a
  110px scroll margin so anchors clear the sticky pill.
- Sticker piles: `.pile` / `.pile-short` / `.pile-tall`; sticker sizes
  `.stk-xl` / `.stk-l` / `.stk-m` / `.stk-xs` / `.stk-sign`.
- Bento boards: `.board-home` and `.board-five` use `grid-template-areas`;
  `.tile-split` puts a sticker column beside the copy.
- Radii: `rounded-sheet` 22px, `rounded-panel` 28px, pills 999px.

## Sticker system

Specification for any new sticker:

- One object, full silhouette, no crop, rotated between -15° and +15°.
- Photorealistic editorial product photography, 50–85mm equivalent, upper-left
  soft large-source light, visible material imperfections.
- Die-cut white border with a soft contact shadow (`drop-shadow`), never a
  rectangular box behind the asset.
- Fully transparent background, 800px on the long edge, WebP, saved as
  `public/images/sticker-<name>.webp`.
- Registered in `content/stickers.ts` with name, src, width and height. Piles are
  authored as `StickerPlacement[]` in each page, and rendered by `StickerCluster`.

`Sticker` is a client component: decorative (`alt=""`), draggable with pointer
events. Mouse drags immediately; touch waits for a horizontal intent and the
element uses `touch-action: pan-y`, so vertical scrolling is never hijacked.

## Routes and sections

Every prototype hash route is a real Next route; links use `next/link` and
section `data-s` values are the ids.

- `/` — HomeHero (chat panel) · Statement + facts · `#how-it-works` (Three things,
  every day.) · `#who` (AudienceSplit) · `#plate` (BentoBoard, home) ·
  `#your-data` (TrustLines) · `#faq` · `#get-started`
- `/shops` — PageHero · `#day` (DayRows) · `#get` (BentoBoard, five) ·
  `#dont-need` (NopeList + PriceBand) · `#faq` · `#get-started`
- `/distributors` — PageHero · `#problem` (ThreeTiles) · `#see` (BentoBoard, five) ·
  `#pilot` (FourSteps) · `#consent` (ConsentPanel + PriceBand) · `#faq` ·
  `#get-started`
- `/privacy` — LegalLayout, `p-1`…`p-16` with a sticky table of contents
- `/terms` — LegalLayout, `t-1`…`t-20`

Shared: `SiteHeader` (sticky solid pill: logo, nav, cream CTA, theme toggle,
burger + full-screen mobile menu) and `SiteFooter` (lead + capture, three link
columns, giant wordmark with sign-off stickers, bottom bar).

## Copy and content

Long copy lives in typed files: `content/faq.ts`, `content/privacy.ts`,
`content/terms.ts`, `content/site.ts`. Legal inline formatting is a small subset
of markdown (`**bold**`, `[label](href)`, newline) rendered by `RichText`.

Brand name is **Mimi**, never Miriam (the email domain stays `miriam.africa`).
No em dashes. Legal pages read "Last updated: 15 October 2026" and are drafts.

## Motion

| Moment | Behaviour |
| --- | --- |
| Load | Hero eyebrow, headline, subline and CTAs rise in sequence (150/200/280/350ms). |
| Reveal | Sections fade and rise 16px on scroll via `[data-reveal]` + IntersectionObserver (`AppMotion`). |
| Drop | Stickers fall in from above via `[data-drop]` with a per-sticker `--d` stagger. |
| Idle | Every 2.6–4.4s a sticker drifts up to 1.6px. |
| Hover / drag | +4% scale with a slight lean on hover; drag translates and rotates, releasing with a 520ms settle. |
| Reduced motion | All of the above are off; the static composition stays finished. |

`AppMotion` re-arms on route change. Easing is `cubic-bezier(.22, 1, .36, 1)`
throughout. Transform-only motion.

## Forms

`CtaForm` builds a `mailto:contact@miriam.africa` from the field values and shows
an inline confirmation, matching the prototype. Its `handleSubmit` is the single
seam to swap for an API route or server action. `NewsletterForm` shows a local
confirmation only, as in the prototype.

## SEO

Per-page title and description, canonical URLs, Open Graph and Twitter cards
using `hero.jpg`, plus `app/sitemap.ts` and `app/robots.ts`. `metadataBase` is
`NEXT_PUBLIC_SITE_URL` or `https://mimi.africa`. Icons come from the brand kit
(`app/favicon.ico`, `app/apple-icon.png` plus the tile/black SVGs and PNGs).

## Sound — not ported

The prototype has no sound; neither does the port. If interaction sound returns,
the prototype's contract is inline `play()` calls on activation, never on hover,
collisions or anything that fires in bursts.
