import assert from "node:assert/strict";
import { test } from "node:test";
import { splitUrls, toPlainText } from "./plain-text.ts";

test("markdown syntax never shows raw in a helper reply", () => {
  assert.equal(toPlainText("5 shops owe **₦385,900** in all"), "5 shops owe ₦385,900 in all");
  assert.equal(toPlainText("## Plan\nSlip `POS 2281`. ==Self-reported== for now."), "Plan\nSlip POS 2281. Self-reported for now.");
  assert.equal(toPlainText("- one\n* two\n+ three\n- [x] done"), "• one\n• two\n• three\n• done");
  assert.equal(toPlainText("1. first\n2. second"), "1. first\n2. second");
  assert.equal(toPlainText("> quoted *soft* and _quiet_ ~~old~~"), "quoted soft and quiet old");
  assert.equal(toPlainText("See [the book](https://userail.money/book) or [https://x.io](https://x.io)"), "See the book or https://x.io");
  assert.equal(toPlainText("![slip](https://x.io/a.png) sent"), "slip sent");
  assert.equal(toPlainText("Joy [[shop:Joy Provisions]] paid [^2]."), "Joy Joy Provisions paid.");
});

test("line breaks stay, runs of blank lines collapse", () => {
  assert.equal(toPlainText("a\nb\n\n\n\nc"), "a\nb\n\nc");
  assert.equal(toPlainText("---\nabove\n***"), "above");
});

test("tables and fences read as plain lines", () => {
  assert.equal(toPlainText("| Shop | Owes |\n|---|---:|\n| Chuks | ₦62,400 |"), "Shop · Owes\nChuks · ₦62,400");
  assert.equal(toPlainText("```\nraw **kept**\n```"), "raw **kept**");
});

test("words inside identifiers keep their underscores and stars", () => {
  assert.equal(toPlainText("INV_2304 and 2*3*4"), "INV_2304 and 2*3*4");
  assert.equal(toPlainText("half **open"), "half open");
});

test("URLs split out for auto-linking, trailing punctuation left out", () => {
  assert.deepEqual(splitUrls("Go to https://userail.money/pay."), [{ text: "Go to " }, { text: "https://userail.money/pay", url: "https://userail.money/pay" }, { text: "." }]);
});
