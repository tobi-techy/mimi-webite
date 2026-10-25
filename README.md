# Mimi website

Marketing site and console demo for Mimi, AI agents on WhatsApp for FMCG distributors and brands.
Built with Next.js (App Router), React and TypeScript. Every page is statically generated.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional, defaults work without it
npm run dev                  # http://localhost:3000
```

Requires Node 20.9 or newer.

## Scripts

| Script                    | What it does                                                          |
| ------------------------- | --------------------------------------------------------------------- |
| `npm run dev`             | Local dev server                                                      |
| `npm run build`           | Production build                                                      |
| `npm run build:export`    | Fully static export to `out/` (any static host)                       |
| `npm run start`           | Serve the production build                                            |
| `npm run lint`            | ESLint                                                                |
| `npm run typecheck`       | TypeScript, no emit                                                   |
| `npm run format`          | Prettier                                                              |
| `npm run knip`            | Unused files, exports and dependencies (config in `knip.json`)        |
| `npm run optimize:images` | Rebuild photo, sticker and poster variants from their sources         |
| `npm run optimize:svg`    | Rebuild brand and console SVGs from `assets-src/` (`svgo.config.cjs`) |
| `npm run encode:video`    | Re-encode the home hero video (needs ffmpeg)                          |

## Environment variables

All are public and optional. See `.env.example`.

| Variable                    | Purpose                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Real domain, no trailing slash. Drives canonical links, Open Graph URLs, sitemap and robots. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address used by every contact link and the form fallback.                                    |
| `NEXT_PUBLIC_WHATSAPP`      | International digits only, e.g. `2348012345678`. Empty hides WhatsApp buttons.               |
| `NEXT_PUBLIC_FORM_ENDPOINT` | Form POST target (Formspree, Tally, your API). Empty falls back to mailto.                   |

## Architecture

Two shells share one root document. The marketing site and the console demo each have their own
layout, components, content and stylesheet, so neither loads the other's CSS or JavaScript.

```
src/
  app/
    layout.tsx           Root layout (RootDocument: fonts, theme boot script, shared CSS)
    global-not-found.tsx Global 404 with its own document (keeps site CSS off console routes)
    (marketing)/         Marketing routes; layout.tsx adds the site shell; not-found.tsx
    console/             Console demo routes (noindex, disallowed in robots.txt)
      threads/[slug]/    A thread (Oshodi is fully worked; others show a summary)
      shops/             List lives in layout.tsx; shops/[id] opens the shop drawer over it
      credit/  approvals/  settings/  settings/[section]/
    sitemap.ts robots.ts manifest.ts
  assets/fonts/          Geist Sans + Mono, subset woff2 (loaded by lib/fonts.ts)
  components/            Shared by both shells
    layout/              RootDocument
    navigation/          PageTransition (React <ViewTransition>), ShellLink
    theme/               ThemeToggle
    ui/                  Section, Button, Cards, Photo, Sticker, ...
  config/                site, routes, theme, motion switches
  features/
    marketing/
      components/ sections/<page>/ content/ forms/ auth/ blog/
      motion/ hooks/     One module per animation (see "Animations")
      assets/photos/     Photo sources + generated manifest (photos.generated.ts)
      styles/            Factory tokens and site CSS
    console/
      components/        shell, threads, shops, credit, settings, usage, computers, charts, ui
      content/           Typed sample data (threads, shops, credit, settings, usage, ...)
      hooks/ lib/        Small client stores (approvals, computers, connectors, session values)
      styles/            Console tokens and CSS, split by area
  hooks/ lib/ styles/ types/
assets-src/              Image, SVG and video sources (never shipped)
scripts/                 optimize-images.mjs, encode-hero-video.sh
public/                  Favicons, OG image, generated media, stickers, brand SVGs, llms.txt
```

Code rules: server components by default, `"use client"` only on interactive leaves, small typed
components, no `any`. Content lives in typed `content/` modules, never inline in components.

## Console demo

`/console` is a clickable product demo for the Wigmore Trading workspace. All data is sample data
in `src/features/console/content`; nothing is sent anywhere and actions show a toast.

- Sidebar order: New thread, Approvals, Threads, Shops, Credit, with Settings at the bottom.
  Inside `/console/settings` the sidebar switches to the settings sections.
- Thread view: open-thread tabs, conversation with minimap and jump pill, follow-up composer, and a
  side panel with Activity, Sub-tasks and Computer tabs. The proposed plan opens in the panel.
- Live computer window: drag it by its bar (or focus the bar and use the arrow keys) and resize it
  from the corner. Position, size and "closed" are kept in sessionStorage for the session.
- Shops: search, route tabs, status filter and sort; a shop opens as a drawer at `/console/shops/[id]`
  (linkable; Escape, the scrim or the close button go back).
- Credit: recommended limit changes (accept or dismiss updates the line) and the credit lines table.
- Settings: General (with payment providers), Connectors (connect modal), Computers (live grid,
  pause all), Support, Organization, Members, Shops access, Billing, and Usage (SVG charts, paged
  shops table, CSV export). Charts are plain SVG components in `components/charts`; no chart library.
- ⌘K / Ctrl+K opens the command palette everywhere in the console.
- Below 900px the sidebar is a drawer (same nav items and footer).

### Console UI components

Every screen is built from the shared pieces in `src/features/console/components/ui`, styled once in
`src/features/console/styles/ui.css` (loaded last). Reach for these before writing new markup or CSS:

| Component              | Use                                                                    |
| ---------------------- | ---------------------------------------------------------------------- |
| `Page`                 | Centred content column: fluid up to 1080px, `wide` for tables (1200px) |
| `Button`, `ButtonLink` | `variant` primary / secondary / ghost, `size` sm / md (`buttonClass`)  |
| `NavGroup`, `NavItem`  | Every sidebar list (app, recent threads, settings, footer, drawer)     |
| `Table`                | Data tables: hairline rows, mono header; `fit` lets cells wrap         |
| `Row`                  | Settings row: label and description left, control right, 56px min      |
| `Select`, `Picker`     | Dropdowns; settings selects share the bordered trigger                 |
| `Toggle`               | On/off switch, neutral (ink track when on)                             |
| `Kbd`, `Kbds`          | Keyboard keys                                                          |
| `Avatar`, `Identity`   | Initials circle; avatar with name and second line                      |
| `Chip`, `Pill`         | Neutral mono tag; status tag                                           |

Links inside the console inherit colour (no underline) from `styles/base.css`, so a `Link` styled as a
button or nav item never falls back to browser link styles.

## Design system

Factory style, locked. Dark default with a light toggle, `#101010` canvas, warm greys, hairline borders,
Geist and Geist Mono labels, neutral buttons with 3px corners, `#ee6018` only for status and marks.
Tokens live in `src/features/marketing/styles/tokens.css` and `src/features/console/styles/tokens.css`.
Please don't add new colours or fonts.

## Transitions

- Page changes use React `<ViewTransition>` (`components/navigation/PageTransition.tsx`, styles in
  `src/styles/transitions.css`): the old page drops at once and the new one wipes in from the top
  with a 20px rise over 300ms. The marketing nav and the console window bar and sidebar carry their
  own `view-transition-name`, so they stay put. Both shells use the same transition.
- Theme switches (`lib/theme.ts`) reveal the new theme as a circle growing from the toggle, inside
  one View Transition snapshot. Unsupported browsers swap instantly.
- `prefers-reduced-motion: reduce` turns every transition into an instant swap.

## Animations

Each marketing animation is its own module in `src/features/marketing/motion` with a hook in
`src/features/marketing/hooks`. Turn any one off in `src/config/motion.ts` (loader, reveal,
scrollProgress, navHairline, photoParallax, countUp, triggeredStories, stickers, tapToSlap,
faqAccordion); its content then shows in its final state. Reduced-motion users and no-JavaScript
visitors always get the final, fully visible state.

## Images and media

Quality comes first: savings come from right-sizing and modern formats, never from visible softening.

- Photos: `npm run optimize:images` turns `src/features/marketing/assets/photos/*.jpg` into AVIF
  (q62) and WebP (q84) at 480 to 1600px plus an OG JPEG, and writes `photos.generated.ts` (sizes and
  blur placeholders). `<Photo>` serves them through `<picture>` and the custom loader in
  `src/lib/image-loader.ts`, so `next build` and the static export ship the same files.
- Stickers: WebP q85, at most 500px wide (2x their render size).
- SVGs: `npm run optimize:svg` (SVGO, 3-decimal precision). Every output was rendered against its
  source and is pixel-identical; lower precision visibly faceted the mascot's eyes.
- Hero video: `npm run encode:video` (1280px H.264, CRF 28, faststart). It only loads when motion
  and data saver allow it; otherwise the poster shows.

## SEO and AEO

- Per-route metadata (title, description, canonical, Open Graph, Twitter) via the Metadata API.
- `sitemap.xml`, `robots.txt` and a web manifest are generated from `src/app`.
- JSON-LD: Organization, WebSite, SoftwareApplication, BreadcrumbList, BlogPosting and FAQPage.
- `public/llms.txt` gives AI answer engines a plain summary of Mimi. Keep it in step with the copy.

## Add a blog post

Add an entry to `src/features/marketing/content/posts.tsx` (newest first) with a unique `slug`, title, excerpt, date, read time, tag, author, image (from `src/features/marketing/assets/photos`, then run `npm run optimize:images`) and body.
The post page, blog index, home strip, sitemap and JSON-LD pick it up automatically.
Add a line for it in `public/llms.txt`.

## Deploy

Vercel: import the repo, set the env vars above, deploy. No extra config needed.
Static hosts: run `npm run build:export` and upload `out/`.

## Before launch

- Set the real domain in `NEXT_PUBLIC_SITE_URL`.
- Set the contact email, WhatsApp number and form endpoint.
- Confirm pricing.
- Legal review of Terms and Privacy (NDPA).
- Decide on analytics and cookie notice.
