/**
 * `npm run build:console`: the console-only static site for console.userail.money, written to
 * ./out-console with the console at the root ("/" is Mimi, "/shops", "/threads/…", "/credit").
 *
 * The marketing site and the console cannot share root paths (both have /shops), so this build
 * swaps in a staged app directory for the length of one `next build`, then puts everything back:
 *   1. src/app and .next (the full build's output, cache and route types) are moved aside to
 *      .console-build/; tsconfig.json and next-env.d.ts are copied there, since next build may
 *      rewrite them;
 *   2. a new src/app is staged: the root layout and manifest, a robots.txt that disallows all,
 *      a console 404 (ConsoleNotFound), and app/console/* as the route group app/(console)/*;
 *      marketing routes and the sitemap are left out;
 *   3. next build runs with STATIC_EXPORT=1 CONSOLE_EXPORT=1 NEXT_PUBLIC_CONSOLE_BASE="" (every
 *      console href resolves to the root; see src/config/routes.ts) and distDir out-console (in
 *      export mode that is only where the static site goes; the build itself uses a fresh .next);
 *   4. src/app, .next, tsconfig.json and next-env.d.ts are restored, even when the build fails or is
 *      interrupted. A run that finds a leftover .console-build/app restores it first.
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = join(root, "src/app");
const stash = join(root, ".console-build");
const stashedApp = join(stash, "app");
const kept = ["tsconfig.json", "next-env.d.ts"];
const dotNext = join(root, ".next");
const stashedNext = join(stash, "next");

function restore() {
  if (!existsSync(stashedApp)) return;
  rmSync(app, { recursive: true, force: true });
  renameSync(stashedApp, app);
  /* the console build's .next goes; the full build's comes back */
  rmSync(dotNext, { recursive: true, force: true });
  if (existsSync(stashedNext)) renameSync(stashedNext, dotNext);
  for (const f of kept) {
    const saved = join(stash, f);
    if (existsSync(saved)) writeFileSync(join(root, f), readFileSync(saved));
    else rmSync(join(root, f), { force: true });
  }
  rmSync(stash, { recursive: true, force: true });
}

/* NEXT_PUBLIC_MIMI_MODE=demo without an API address builds the sample-data console (see src/features/console/api/config.ts) */
if (process.env.NEXT_PUBLIC_MIMI_MODE === "demo" && !process.env.NEXT_PUBLIC_MIMI_API_URL) {
  console.warn("build:console: NEXT_PUBLIC_MIMI_MODE=demo but NEXT_PUBLIC_MIMI_API_URL is unset, so this build shows sample data");
}

/* a previous run that died mid-build left the real app aside: put it back before anything else */
if (existsSync(stashedApp)) {
  console.warn("build:console: restoring src/app from an interrupted run");
  restore();
}

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    restore();
    process.exit(130);
  });
}

let status = 1;
try {
  mkdirSync(stash, { recursive: true });
  for (const f of kept) if (existsSync(join(root, f))) cpSync(join(root, f), join(stash, f));
  renameSync(app, stashedApp);
  if (existsSync(dotNext)) renameSync(dotNext, stashedNext);

  mkdirSync(app, { recursive: true });
  cpSync(join(stashedApp, "layout.tsx"), join(app, "layout.tsx"));
  cpSync(join(stashedApp, "manifest.ts"), join(app, "manifest.ts"));
  /* robots.ts reads CONSOLE_ONLY and disallows everything in this build */
  cpSync(join(stashedApp, "robots.ts"), join(app, "robots.ts"));
  writeFileSync(
    join(app, "global-not-found.tsx"),
    `import type { Metadata, Viewport } from "next";
import { ConsoleNotFound } from "@/features/console/components/shell/ConsoleNotFound";
import { siteIcons, siteViewport } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page not found · Mimi console demo",
  robots: { index: false, follow: false },
  icons: siteIcons,
};

export const viewport: Viewport = { ...siteViewport, viewportFit: "cover" };

export default ConsoleNotFound;
`,
  );
  cpSync(join(stashedApp, "console"), join(app, "(console)"), { recursive: true });

  rmSync(join(root, "out-console"), { recursive: true, force: true });
  const res = spawnSync(join(root, "node_modules/.bin/next"), ["build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1", CONSOLE_EXPORT: "1", NEXT_PUBLIC_CONSOLE_BASE: "" },
  });
  status = res.status ?? 1;
} finally {
  restore();
}

if (status === 0) console.log("build:console: wrote out-console/");
process.exit(status);
