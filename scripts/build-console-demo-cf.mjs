/**
 * `npm run build:console-demo-cf`: the demo console for Cloudflare (deploy/demo-console).
 * PREPARED, NOT DEPLOYED: this only builds; deploying is a separate, manual `wrangler deploy`.
 *
 * Reads MIMI_DEMO_API_URL (the demo API's public HTTPS address; a placeholder until it exists),
 * builds the console with NEXT_PUBLIC_MIMI_MODE=demo and NEXT_PUBLIC_MIMI_API_URL set to it, then
 * writes out-console/_headers: security headers and a Content-Security-Policy that lets the page
 * talk only to itself and that API (audio and attachments play from blob: URLs).
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const api = (process.env.MIMI_DEMO_API_URL ?? "").trim().replace(/\/+$/, "");

if (!api || api.includes("REPLACE-ME")) {
  console.error("build:console-demo-cf: set MIMI_DEMO_API_URL to the demo API's public https address (see deploy/demo-console/env.example)");
  process.exit(2);
}
let origin;
try {
  const u = new URL(api);
  if (u.protocol !== "https:") throw new Error("not https");
  origin = u.origin;
} catch {
  console.error(`build:console-demo-cf: MIMI_DEMO_API_URL must be an https URL, got ${api}`);
  process.exit(2);
}

const run = spawnSync(process.execPath, [join(root, "scripts/build-console.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_MIMI_MODE: "demo", NEXT_PUBLIC_MIMI_API_URL: origin },
});
if (run.status !== 0) process.exit(run.status ?? 1);

const csp = [
  "default-src 'self'",
  /* Next's static export inlines its bootstrap scripts */
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  /* markdown images may be any https image; attachments show from blob: */
  "img-src 'self' https: blob: data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self' ${origin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

writeFileSync(
  join(root, "out-console/_headers"),
  `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: microphone=(self), camera=(self), geolocation=()
  X-Robots-Tag: noindex
  Strict-Transport-Security: max-age=31536000

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
`,
);
console.log(`build:console-demo-cf: out-console/ is the demo console for ${origin} (not deployed)`);
