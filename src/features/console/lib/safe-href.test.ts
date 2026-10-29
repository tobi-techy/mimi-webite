import assert from "node:assert/strict";
import { test } from "node:test";
import { safeHref } from "./safe-href.ts";

test("only web, mail, phone and console paths become links", () => {
  assert.equal(safeHref("https://userail.money"), "https://userail.money");
  assert.equal(safeHref("mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(safeHref("tel:+2348000000000"), "tel:+2348000000000");
  assert.equal(safeHref("/console/shops"), "/console/shops");
  assert.equal(safeHref("javascript:alert(1)"), undefined);
  assert.equal(safeHref(" JavaScript:alert(1)"), undefined);
  assert.equal(safeHref("data:text/html,<b>x</b>"), undefined);
  assert.equal(safeHref("//evil.example"), undefined);
  assert.equal(safeHref(undefined), undefined);
});
