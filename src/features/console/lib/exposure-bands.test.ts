/**
 * Money at risk, the ageing band rows (Tobi, 4 Nov 2026). The live API sends a null bound on the
 * current band (no lower bound) and on the oldest one (no upper bound). A nought in either place
 * printed as "0 to 0 days" and "61 to 0 days" on the money screen, which reads like a data bug, so
 * these tests hold the two rows that have an open end to words, and hold the two that do not to
 * exactly what the screen printed before.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { bandRange, bandSubline } from "./exposure-bands.ts";
import type { ExposureBand } from "../content/exposure.ts";

/* the four bands exactly as GET /v1/credit/exposure sent them on 4 Nov 2026 */
const LIVE: ExposureBand[] = [
  { key: "current", label: "Not yet due", fromDays: null, toDays: 0, weightPct: 100 },
  { key: "days_1_30", label: "1 to 30 days", fromDays: 1, toDays: 30, weightPct: 125 },
  { key: "days_31_60", label: "31 to 60 days", fromDays: 31, toDays: 60, weightPct: 150 },
  { key: "days_over_60", label: "Over 60 days", fromDays: 61, toDays: null, weightPct: 200 },
];

/** One row as the screen composes it: the band's own name, then its second line. */
const row = (b: ExposureBand) => `${b.label} ${bandSubline(b)}`;

test("no row prints a range of no days: an absent bound is words, not a nought", () => {
  const rows = LIVE.map(row);
  for (const r of rows) {
    assert.ok(!r.includes("0 to 0"), `a zero range is never printed: ${r}`);
    assert.ok(!/\b0 days\b/.test(r), `a zero-day range is never printed: ${r}`);
    assert.ok(!r.includes("to 0 days"), `an open end is never printed as a nought: ${r}`);
  }
});

test("the four live bands read as the screen shows them", () => {
  assert.deepEqual(LIVE.map(row), [
    "Not yet due weighted at 100%",
    "1 to 30 days 1 to 30 days · weighted at 125%",
    "31 to 60 days 31 to 60 days · weighted at 150%",
    "Over 60 days 61 days and over · weighted at 200%",
  ]);
});

test("the current band states no range at all: its own name already says it", () => {
  assert.equal(bandRange(null, 0), null, "not yet due is not a range of days");
  assert.equal(bandSubline(LIVE[0]!), "weighted at 100%");
});

test("a band with both ends keeps the range it always printed", () => {
  assert.equal(bandRange(1, 30), "1 to 30 days");
  assert.equal(bandRange(31, 60), "31 to 60 days");
  assert.equal(bandSubline(LIVE[1]!), "1 to 30 days · weighted at 125%");
});

test("an open upper end reads from its lower bound upward", () => {
  assert.equal(bandRange(61, null), "61 days and over");
  assert.equal(bandSubline(LIVE[3]!), "61 days and over · weighted at 200%");
});

test("an upper bound with no lower one, and no bound at all, both stay honest", () => {
  assert.equal(bandRange(null, 30), "up to 30 days");
  assert.equal(bandRange(null, null), null, "nothing to state, so nothing is stated");
  assert.equal(bandSubline({ fromDays: null, toDays: null, weightPct: 50 }), "weighted at 50%");
});
