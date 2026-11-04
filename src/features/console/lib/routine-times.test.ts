/**
 * Routines, the times in words (Tobi, 4 Nov 2026). The API sends a schedule as a sentence and the
 * two times as ISO instants, and the console words those instants itself in Lagos, the product's one
 * zone. These tests hold the words the rail prints, hold a nought time to "Not run yet" rather than
 * a made-up instant, and hold the Lagos day boundary, where a UTC-day reading would say "today"
 * about a routine that ran yesterday evening.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { lastRunWords, nextRunWords, nextTimeWords, readWords, routineLine, timeWords } from "./routine-times.ts";
import { parseApiTime } from "../api/mappers.ts";
import type { Routine } from "../content/routines.ts";

/** An instant from Lagos wall-clock words: Africa/Lagos is UTC+1 all year, so 8:00 AM is 07:00Z. */
const lagos = (y: number, m: number, d: number, h: number, min = 0) => Date.UTC(y, m - 1, d, h - 1, min);

const NOW = lagos(2026, 11, 4, 9, 4);

const routine = (o: Partial<Routine> = {}): Routine => ({
  id: "morning_brief",
  name: "Morning briefing",
  schedule: "Every day at 8:00 AM",
  paused: false,
  pausedReason: "",
  lastRunAt: lagos(2026, 11, 4, 8, 0),
  nextRunAt: lagos(2026, 11, 5, 8, 0),
  finding: "",
  findingShopId: "",
  ...o,
});

test("a time reads as today or yesterday in Lagos, and as a date beyond that", () => {
  assert.equal(timeWords(lagos(2026, 11, 4, 8, 0), NOW), "today at 8:00 AM");
  assert.equal(timeWords(lagos(2026, 11, 3, 18, 0), NOW), "yesterday at 6:00 PM");
  assert.equal(timeWords(lagos(2026, 10, 31, 8, 0), NOW), "31 Oct at 8:00 AM");
});

test("the Lagos day decides today, not the UTC day", () => {
  /* both instants are 3 Nov in UTC; in Lagos the first is last night and the second is this morning */
  const justAfterMidnight = lagos(2026, 11, 4, 0, 10);
  assert.equal(timeWords(lagos(2026, 11, 3, 23, 30), justAfterMidnight), "yesterday at 11:30 PM");
  assert.equal(timeWords(lagos(2026, 11, 4, 0, 5), justAfterMidnight), "today at 12:05 AM");
});

test("a next run says tomorrow when it is tomorrow", () => {
  assert.equal(nextTimeWords(lagos(2026, 11, 5, 8, 0), NOW), "tomorrow at 8:00 AM");
  assert.equal(nextTimeWords(lagos(2026, 11, 6, 8, 0), NOW), "6 Nov at 8:00 AM");
});

test("the whole line: schedule, when it last ran, when it runs next", () => {
  assert.equal(
    routineLine(routine(), NOW),
    "Every day at 8:00 AM · Last ran today at 8:00 AM · Next run tomorrow at 8:00 AM",
  );
});

test("a routine that has never run says so, never a made-up instant", () => {
  assert.equal(lastRunWords(routine({ lastRunAt: 0 }), NOW), "Not run yet");
  assert.equal(routineLine(routine({ lastRunAt: 0 }), NOW).includes("Not run yet"), true);
});

test("a next run the API did not send is left out, rather than guessed at", () => {
  assert.equal(nextRunWords(routine({ nextRunAt: 0 }), NOW), "");
  assert.equal(
    routineLine(routine({ nextRunAt: 0 }), NOW),
    "Every day at 8:00 AM · Last ran today at 8:00 AM",
    "the line drops the part the API did not send",
  );
});

test("a schedule the API did not send does not leave a hanging separator", () => {
  assert.equal(routineLine(routine({ schedule: "" }), NOW), "Last ran today at 8:00 AM · Next run tomorrow at 8:00 AM");
});

test("the as-of time on the two books screen is worded in Lagos, and absent stays absent", () => {
  assert.equal(readWords("2026-11-04T08:04:00+01:00", parseApiTime, NOW), "Read today at 8:04 AM");
  assert.equal(readWords("", parseApiTime, NOW), "");
  assert.equal(readWords("not a time", parseApiTime, NOW), "");
});
