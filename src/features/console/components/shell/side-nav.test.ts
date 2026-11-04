/**
 * The sidebar's destinations (owner's design correction, 4 Nov 2026). "Computer tasks" came out: a
 * top-level destination whose job is to let the owner start a browsing job is the wrong shape for
 * this product, where the computer is the agent's own working surface and the agent reaches for it
 * itself. The routes, the pages and their data path stay, so a deep link still renders; only the
 * destination goes. This reads the sidebar's own source, so the row cannot creep back, by name.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
/** the source without its comments: a comment may explain the correction, the code may not undo it */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const SIDE_NAV = "src/features/console/components/shell/SideNav.tsx";

test("the sidebar has no Computer tasks destination, and no way back to it", () => {
  const nav = code(SIDE_NAV);
  assert.ok(!/Computer tasks/i.test(nav), 'the label "Computer tasks" is gone from the sidebar');
  assert.ok(
    !/consoleRoutes\.computers/.test(nav),
    "the sidebar links nowhere near the computers route, on the rail strip or in the navigation",
  );
});

test("the other destinations are still there: removing the row left no hole", () => {
  const nav = code(SIDE_NAV);
  for (const label of ["Shops", "Credit limits", "Money at risk", "Returns", "Two books", "Routines", "Back to app"]) {
    assert.ok(nav.includes(`label="${label}"`), `the ${label} destination is still in the sidebar`);
  }
});

test("the routes and pages stay, so a deep link still renders", () => {
  assert.match(
    read("src/features/console/config.ts"),
    /computers: consolePath\("\/computers"\)/,
    "the route is still declared, so an old link or a typed URL resolves",
  );
  for (const page of ["src/app/console/computers/page.tsx", "src/app/console/computers/new/page.tsx"]) {
    assert.ok(read(page).includes("ConsoleView"), `${page} still renders on its own`);
  }
});
