## What and why

<!-- One or two lines. Link the Linear issue if there is one. -->

## Checklist

- [ ] CI is green (lint, typecheck, static export)
- [ ] Checked on a phone width (375 and 390), dark and light, no sideways scroll
- [ ] Titles, descriptions and share banners right for any page touched (`npm run og:banners` if a banner changed)
- [ ] Plain words on the page: no jargon, figures match pricing and the product
- [ ] No keys or private emails beyond what `.env.example` already shows
- [ ] `npm run build:export` and `npm run build:console` both build if the console was touched
- [ ] Every review thread answered (fixed, or a reason in the thread)
- [ ] Merged only, not deployed: deploys go through the Cloudflare dashboard
