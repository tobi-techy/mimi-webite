/**
 * "Run now" (5 Nov 2026): the owner who wants today's brief before the routine's own 8:00 AM tick.
 * A run counts as started only when the API answered with the routine's own row; a refusal is shown
 * in the API's own sentence, and a server without the route loses the control. Tests run with
 * `npm run test:console`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readRunRow } from "../api/mappers.ts";
import { RUN_FAILED, refusalWords, runOutcome } from "./routine-run.ts";
import type { Routine } from "../content/routines.ts";

const row: Routine = {
  id: "morning_brief",
  name: "Morning briefing",
  schedule: "Every day at 8:00 AM",
  paused: false,
  pausedReason: "",
  lastRunAt: 0,
  nextRunAt: Date.UTC(2026, 10, 5, 7, 0),
  finding: "",
  findingShopId: "",
};

test("a run is started only when the API answers with the routine's own row", () => {
  const ok = runOutcome({ row });
  assert.equal(ok.started, true);
  assert.equal(ok.note, undefined);
  assert.equal(runOutcome({ row: null }).started, false);
  assert.equal(runOutcome({ row: null }).note, RUN_FAILED, "no sentence: the console's own honest line, never a success");
});

test("a refusal is shown in the API's own words, never re-worded", () => {
  const refused = runOutcome({ row: null, detail: "Today's morning briefing already ran." });
  assert.equal(refused.started, false);
  assert.equal(refused.note, "Today's morning briefing already ran.");
  assert.equal(refused.missing, undefined, "a refusal is not a missing route");
});

test("the two documented refusals are shown as written, and no other answer is printed as one", () => {
  assert.equal(
    refusalWords(409, "It is paused, so it did not run. The reason: held until the cards are filed."),
    "It is paused, so it did not run. The reason: held until the cards are filed.",
    "the API's own refusal: the owner reads the sentence it wrote",
  );
  assert.equal(refusalWords(404, "unknown routine"), "unknown routine", "the route is deployed and answered");
  assert.equal(refusalWords(401, "Missing bearer"), "", "an auth failure is reported, not printed on the row");
  assert.equal(refusalWords(500, "Internal Server Error"), "");
  assert.equal(refusalWords(-1, ""), "", "a dropped connection is ours to report");
  /* and a refusal end to end: the sentence on the row, never a run */
  const out = runOutcome({ row: null, detail: refusalWords(409, "It is paused, so it did not run.") });
  assert.equal(out.started, false);
  assert.equal(out.note, "It is paused, so it did not run.");
});

test("a route this server does not have says so, so the control can go away", () => {
  const gone = runOutcome({ row: null, missing: true });
  assert.equal(gone.started, false);
  assert.equal(gone.missing, true);
  assert.equal(gone.note, "", "nothing to show on the row: the control is hidden instead");
});

test("only the routine's own row reads as a run: bare, under routine, or as a one-row list", () => {
  const apiRow = { id: "morning_brief", name: "Morning briefing", schedule: "Every day at 8:00 AM", paused: false, last_run_at: "", next_run_at: "2026-11-05T08:00:00+01:00", last_finding: "" };
  for (const body of [apiRow, { routine: apiRow }, { routines: [apiRow] }]) {
    assert.equal(readRunRow(body)?.id, "morning_brief", JSON.stringify(body).slice(0, 60));
  }
});

test("a refusal, an empty answer or a shape we do not know is not a run", () => {
  assert.equal(readRunRow({ detail: "Today's morning briefing already ran." }), null);
  assert.equal(readRunRow({}), null);
  assert.equal(readRunRow(null), null);
  assert.equal(readRunRow({ routines: [] }), null, "no row is not a run");
  assert.equal(readRunRow({ id: "morning_brief", name: "morning_brief" }), null, "a machine token is not a row");
});
