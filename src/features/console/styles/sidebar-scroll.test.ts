import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

/*
 * Guards the sidebar scroll fix (30 Oct 2026). The sidebar has one scroller at every size, the
 * list between the links and the owner row (`.mc-side__scroll`). The column around it
 * (`.mc-side__full`) must never become a scroller itself, at any breakpoint: when it did (phones and
 * windows under 700px tall) the header and footer slid with the list, the footer sat below the fold,
 * and crossing the breakpoint swapped the scroll container mid-gesture, which read as a jump.
 */
const here = dirname(fileURLToPath(import.meta.url));
const css = readdirSync(here)
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(join(here, f), "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");

/** every innermost `selectors { declarations }` block, @media wrappers or not */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: (m[1] ?? "").split(",").map((s) => s.trim().replace(/\s+/g, " ")),
  body: m[2] ?? "",
}));

/** the rules whose selector, after its last combinator, targets `cls` itself (not a descendant) */
const rulesFor = (cls: string) =>
  rules.filter((r) =>
    r.selectors.some((s) => {
      const last = s.split(/\s*[ >+~]\s*/).pop() ?? "";
      return last.split(/(?=[.:[#])/).includes(cls);
    }),
  );

const declares = (body: string, prop: string) =>
  [...body.matchAll(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "g"))].map((m) => (m[1] ?? "").trim());

test("the sidebar column never scrolls itself", () => {
  for (const r of rulesFor(".mc-side__full")) {
    for (const prop of ["overflow", "overflow-y"]) {
      for (const v of declares(r.body, prop)) {
        assert.ok(!/auto|scroll/.test(v), `.mc-side__full got ${prop}: ${v} (${r.selectors.join(", ")})`);
      }
    }
  }
});

test("the list is the one scroller: it can shrink, scrolls, and keeps flings to itself", () => {
  const list = rulesFor(".mc-side__scroll");
  const all = (prop: string) => list.flatMap((r) => declares(r.body, prop));
  assert.ok(all("min-height").includes("0"), "the list needs min-height: 0 to shrink inside the column");
  assert.ok(all("overflow-y").includes("auto"), "the list needs overflow-y: auto");
  assert.ok(all("overscroll-behavior").includes("contain"), "the list needs overscroll-behavior: contain");
  for (const prop of ["overflow", "overflow-y"]) {
    assert.ok(!all(prop).includes("visible"), `no breakpoint may turn the list's ${prop} back to visible`);
  }
});

test("the roster list keeps its scroll at every breakpoint", () => {
  for (const r of rulesFor(".mc-side__team")) {
    for (const prop of ["overflow", "overflow-y"]) {
      assert.ok(!declares(r.body, prop).includes("visible"), `.mc-side__team got ${prop}: visible (${r.selectors.join(", ")})`);
    }
    assert.ok(!declares(r.body, "flex").includes("none"), `.mc-side__team got flex: none (${r.selectors.join(", ")})`);
  }
});
