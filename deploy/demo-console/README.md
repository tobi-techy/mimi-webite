# Demo console on Cloudflare (demo.userail.money)

**Prepared, not deployed.** Nothing in this folder has been run against Cloudflare, and the
demo API address is still a placeholder (`env.example`).

What it is: the console's static export (`out-console/`) built in demo mode, served by a
Cloudflare Worker with static assets only (no Worker script, no server code) on the custom
domain `demo.userail.money`.

| File | What |
|---|---|
| `wrangler.jsonc` | Worker `mimi-console-demo`: assets from `out-console/`, clean URLs, the console's own 404, custom domain `demo.userail.money`, no `workers.dev` or preview URLs |
| `env.example` | `MIMI_DEMO_API_URL`, the demo API's public address. **Placeholder** |
| `../../scripts/build-console-demo-cf.mjs` | `npm run build:console-demo-cf`: checks the address, runs `build:console` with `NEXT_PUBLIC_MIMI_MODE=demo` and `NEXT_PUBLIC_MIMI_API_URL`, then writes `out-console/_headers` (security headers and a CSP that allows only this site and the API) |

## Steps, when the API is live

1. Run the MIMI-AGENT API with `MIMI_MODE=demo` on a public HTTPS host, with at least:
   `MIMI_ENV=production`, `MIMI_DEMO_IP_SALT` (a random secret), `MIMI_DEMO_TRUST_FORWARDED=1`
   only behind a proxy that appends `X-Forwarded-For`, `MIMI_CORS_ORIGINS=https://demo.userail.money`,
   `MIMI_MEDIA_DIR` on a volume, and the caps (`MIMI_DEMO_IP_DAILY_CAP_NAIRA`,
   `MIMI_DEMO_GLOBAL_DAILY_CAP_NAIRA`). See MIMI-AGENT `docs/API.md`, "Demo mode".
2. `MIMI_DEMO_API_URL=https://<that host> npm run build:console-demo-cf`
3. `npx wrangler@4 deploy --config deploy/demo-console/wrangler.jsonc` (needs a Cloudflare login
   with access to the `userail.money` zone; the custom domain is created on first deploy).
4. Open `https://demo.userail.money`: the first load should show skeletons, then
   "Live demo: your own copy of Coral Lane Trading".

Rollback: `npx wrangler@4 rollback --config deploy/demo-console/wrangler.jsonc`, or remove the
custom domain in the dashboard. The marketing site and console.userail.money are not touched.
