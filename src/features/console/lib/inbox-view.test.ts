/**
 * Helper inboxes from GET /v1/inbox (Tobi, 4 Nov 2026). The contract is frozen, the route is not on
 * the demo server yet, and the screens that ship tonight must look exactly as they do without it.
 * So the first test here is the one that matters most: with no route, nothing changes at all.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  faceStateOf,
  helperIdOf,
  helperLineIn,
  inboxChatLines,
  inboxMimiLines,
  mapHelperLines,
  mapInboxItem,
  mergeByTime,
  sentence,
  taskLineFor,
  type InboxItem,
  type RawInboxItem,
} from "./inbox-view.ts";
import { parseApiTime } from "../api/mappers.ts";
import type { Message } from "../demo/types.ts";

const T = (h: number, m = 0) => `Tue 2026-11-03 ${h}:${String(m).padStart(2, "0")} AM WAT (UTC+01:00)`;
const at = (h: number, m = 0) => Date.UTC(2026, 10, 3, h - 1, m); /* Lagos is UTC+1 */

const raw = (over: Partial<RawInboxItem> = {}): RawInboxItem => ({
  task_id: "itk_1",
  from_helper: "collector",
  from_title: "Collector",
  to_helper: "proof",
  to_title: "Proof",
  skill: "proof/check",
  shop_name: "Mama Sola Provisions",
  ask: "check this screenshot",
  state: "done",
  reason: "",
  outcome: "no bank credit matches, likely fake",
  result: "",
  thread_id: "th_1",
  turn_id: "t_9",
  created_at: T(10, 18),
  finished_at: T(10, 25),
  ...over,
});

const item = (over: Partial<RawInboxItem> = {}): InboxItem => {
  const mapped = mapInboxItem(raw(over), parseApiTime);
  assert.ok(mapped, "the item maps");
  return mapped;
};

/* the lines are a Message union: these read one line's own fields without narrowing everywhere */
const textOf = (m: Message): string => ("text" in m ? m.text : m.kind === "date" ? m.label : "");
const toOf = (m: Message): string | undefined => ("to" in m ? m.to : undefined);
const atOf = (m: Message): number => ("at" in m ? m.at : 0);
const resultOf = (m: Message): string | undefined => (m.kind === "step" ? m.result : undefined);

/* ---------- with no route (the path that ships tonight) ---------- */

test("no inbox items: a chat's lines come back untouched, and nothing is added to a feed", () => {
  const lines: Message[] = [
    { id: "d", kind: "date", label: "Today" },
    { id: "m1", kind: "text", from: "me", text: "Remind Mama Sola", at: at(9) },
  ];
  assert.equal(mergeByTime(lines, []), lines, "the same array: a chat with no items renders as before");
  assert.deepEqual(inboxChatLines([], "Proof"), []);
  assert.deepEqual(inboxChatLines([], "Collector"), []);
  assert.deepEqual(inboxMimiLines([]), []);
});

test("no helper lines from the API: every helper stays without one (the roster keeps its own derivation)", () => {
  assert.equal(helperLineIn(undefined, "Proof"), undefined);
  assert.equal(helperLineIn([], "Proof"), undefined);
  assert.deepEqual(mapHelperLines(undefined), []);
  assert.deepEqual(mapHelperLines([]), []);
});

/* ---------- one handoff, both directions ---------- */

test("the receiver's chat: Collector's task to Proof reads as a dated line, and the ask is in words", () => {
  const line = taskLineFor(item());
  assert.ok(line);
  assert.equal(line.kind, "system");
  assert.equal((line as Extract<Message, { kind: "system" }>).text, "Task from Collector: check this screenshot");
  assert.equal((line as { at: number }).at, at(10, 18));
  assert.equal((line as { turn?: string }).turn, "t_9");
});

test("the sender's chat: the same item reads as one line to Proof with what came back under it", () => {
  const lines = inboxChatLines([item()], "Collector");
  assert.equal(lines.length, 1);
  const line = lines[0]!;
  assert.equal(line.kind, "step");
  assert.equal(line.text, "Handed to Proof: check this screenshot");
  assert.equal(line.to, "Proof", "the line opens her chat, where the work is");
  assert.equal(resultOf(line), "no bank credit matches, likely fake");
});

test("each half renders in exactly one chat: Proof gets the task, Collector gets the result, no double", () => {
  const items = [item()];
  const proof = inboxChatLines(items, "Proof").map(textOf);
  const collector = inboxChatLines(items, "Collector").map(textOf);
  assert.deepEqual(proof, ["Task from Collector: check this screenshot"]);
  assert.deepEqual(collector, ["Handed to Proof: check this screenshot"]);
  assert.deepEqual(inboxChatLines(items, "Credit"), []);
  assert.deepEqual(inboxMimiLines(items), [], "a helper's handoff never lands in Mimi's chat as an update");
});

test("the shop's name never reaches a line: the lines carry the ask and the result, nothing else", () => {
  const all = [...inboxChatLines([item()], "Proof"), ...inboxChatLines([item()], "Collector")];
  assert.ok(!JSON.stringify(all).includes("Mama Sola"));
});

/* ---------- the owner's own ask ---------- */

test("an ask the owner made reads as her own message in the helper's chat, never as one from Mimi", () => {
  const mine = item({ from_helper: "mimi", from_title: "Mimi", to_helper: "collector", to_title: "Collector", ask: "Remind Mama Sola about her balance" });
  const line = taskLineFor(mine);
  assert.ok(line);
  assert.equal(line.kind, "text");
  assert.equal((line as { from: string }).from, "me");
  assert.equal((line as { text: string }).text, "Remind Mama Sola about her balance");
  assert.equal((line as { to?: string }).to, "Collector");
  assert.deepEqual(inboxChatLines([mine], "Collector").map(textOf), ["Remind Mama Sola about her balance"]);
  assert.deepEqual(inboxChatLines([mine], "Collector").map((m) => m.kind), ["text"]);
});

test("what came back on the owner's ask is one update line in Mimi's chat, naming the helper and nothing else", () => {
  const mine = item({ from_helper: "mimi", from_title: "Mimi", to_helper: "collector", to_title: "Collector", ask: "Remind Mama Sola", outcome: "reminder sent to Mama Sola Provisions" });
  const feed = inboxMimiLines([mine]);
  assert.equal(feed.length, 1);
  assert.equal(textOf(feed[0]!), "Collector: reminder sent to Mama Sola Provisions");
  assert.equal(toOf(feed[0]!), "Collector", "the line opens her chat");
  assert.deepEqual(inboxChatLines([mine], "Collector").map((m) => m.kind), ["text"], "her chat keeps the ask, not a copy of the update");
});

/* ---------- words, never codes ---------- */

test("a machine word is never printed as a code", () => {
  assert.equal(sentence("no_bank_credit"), null);
  assert.equal(sentence("refused"), null);
  assert.equal(sentence("  "), null);
  assert.equal(sentence("Checked the screenshot: no match"), "Checked the screenshot: no match");
  assert.equal(sentence("₦160,000"), "₦160,000", "a figure is not a code");
});

test("a failed item says what came back in words; a code reason is dropped, not shown", () => {
  const failed = item({ state: "failed", outcome: "", result: "", reason: "the statement did not open" });
  assert.equal(failed.result, "could not finish it: the statement did not open");
  const coded = item({ state: "failed", outcome: "", result: "", reason: "statement_unreadable" });
  assert.equal(coded.result, "", "a code alone is not a sentence, so the line says nothing extra");
  const back = item({ state: "handed_back", outcome: "", result: "", reason: "needs your approval" });
  assert.equal(back.result, "handed it back: needs your approval");
});

/* ---------- the closed set of states ---------- */

test("only the contract's six states are read; anything else is not turned into a word", () => {
  assert.equal(item({ state: "queued" }).state, "queued");
  assert.equal(item({ state: "handed_back" }).state, "handed_back");
  assert.equal(item({ state: "almost_done" }).state, null, "an unknown state is not guessed at");
  assert.equal(item({ state: "done" }).result, "no bank credit matches, likely fake");
});

/* ---------- the face state ---------- */

test("the face comes from the two counts: waiting on the owner, working, done, idle", () => {
  const line = (open: number, waiting: number, outcome = "") => ({ helper: "Proof" as const, helperName: "Proof", open, waitingOnOwner: waiting, outcome });
  assert.equal(faceStateOf(line(2, 1)), "waiting");
  assert.equal(faceStateOf(line(1, 0)), "working");
  assert.equal(faceStateOf(line(0, 0, "Checked Mama Sola's screenshot")), "done");
  assert.equal(faceStateOf(line(0, 0)), "idle");
  /* blocked is never derived: the contract sends no signal for it */
  assert.notEqual(faceStateOf(line(1, 0)), "blocked");
});

test("the API's own helper lines map by contract id, and Mimi is not one of them", () => {
  assert.equal(helperIdOf("Proof"), "Proof");
  assert.equal(helperIdOf("proof/check"), "Proof");
  assert.equal(helperIdOf("mimi"), null);
  assert.equal(helperIdOf("nobody"), null);
  const lines = mapHelperLines([
    { helper: "proof", helper_name: "Proof", open: 1, waiting_on_owner: 0, outcome: "Checking Mama Sola's screenshot" },
    { helper: "mimi", helper_name: "Mimi", open: 0, waiting_on_owner: 0, outcome: "Team on track" },
    { helper: "brand", helper_name: "Brand", open: 2, waiting_on_owner: -1, outcome: "gmail_expired" },
  ]);
  assert.deepEqual(
    lines.map((l) => [l.helper, l.open, l.waitingOnOwner, l.outcome]),
    [
      ["Proof", 1, 0, "Checking Mama Sola's screenshot"],
      ["Brand", 2, 0, ""],
    ],
    "a negative count is 0, and a code outcome reads as no sentence",
  );
  assert.equal(helperLineIn(lines, "Proof")?.open, 1);
  assert.equal(helperLineIn(lines, "Collector"), undefined);
});

/* ---------- placing lines ---------- */

test("an item whose receiving helper is not one we know is dropped, never shown in another chat", () => {
  assert.equal(mapInboxItem(raw({ to_helper: "bookkeeper" }), parseApiTime), null);
  assert.equal(mapInboxItem(raw({ task_id: "" }), parseApiTime), null);
  const mapped = mapInboxItem(raw({ to_helper: "bookkeeper" }), parseApiTime);
  assert.equal(mapped, null);
});

test("a bad time reads as 0, never as now, and the item still maps", () => {
  const bad = item({ created_at: "not a time", finished_at: "" });
  assert.equal(bad.at, 0);
  assert.equal(atOf(taskLineFor(bad)!), 0);
});

test("lines merge into a chat by time, keeping the day line first", () => {
  const lines: Message[] = [
    { id: "d", kind: "date", label: "Today" },
    { id: "m1", kind: "text", from: "me", text: "Remind Mama Sola", at: at(9) },
    { id: "m2", kind: "text", from: "Collector", text: "Reminder sent", at: at(12) },
  ];
  const merged = mergeByTime(lines, inboxChatLines([item({ to_helper: "collector", to_title: "Collector", from_helper: "proof", from_title: "Proof" })], "Collector"));
  assert.deepEqual(merged.map((m) => m.id), ["d", "m1", "api-ib:itk_1", "m2"]);
});
