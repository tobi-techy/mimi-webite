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

test("images: https or console paths only", async () => {
  const { safeImageSrc } = await import("./safe-href.ts");
  assert.equal(safeImageSrc("https://userail.money/a.png"), "https://userail.money/a.png");
  assert.equal(safeImageSrc("/media/photos/x.webp"), "/media/photos/x.webp");
  assert.equal(safeImageSrc("http://example.com/a.png"), undefined);
  assert.equal(safeImageSrc("data:image/png;base64,AAAA"), undefined);
  assert.equal(safeImageSrc("javascript:alert(1)"), undefined);
  assert.equal(safeImageSrc("blob:https://x/1"), undefined);
  assert.equal(safeImageSrc("//evil.example/a.png"), undefined);
  assert.equal(safeImageSrc("https://"), undefined);
});
