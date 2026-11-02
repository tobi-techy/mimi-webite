/**
 * Round 4 (31 Oct 2026): every helper has her own chat. A message typed in helper X's chat goes to
 * X (assign_to) and her answer lands in her chat, not Mimi's; a handoff leaves one line in the
 * chat that handed it over and the work in the other; a helper's question shows in her chat and in
 * Mimi's "Needs you", and an answer in either place reads answered in both.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { askAnswer, asksIn, assignFor, borrowedChat, handoffTask, ownChat } from "./chat-view.ts";
import { mapThread, plainPause } from "../api/mappers.ts";
import type { ApiThreadDetail } from "../api/types.ts";
import type { Message } from "../demo/types.ts";

const AT = "Sat 2026-10-31 10:18 PM WAT (UTC+01:00)";
const NOW = Date.UTC(2026, 9, 31, 21, 30);

const thread = {
  thread_id: "demo-1:owner", kind: "owner", shop_id: "", shop_name: "", last_at: AT, last_text: "", last_sender: "mimi",
  messages: 0, pending_approvals: 0, helper: "mimi", helper_name: "Mimi", status: "done", title: "You and Mimi",
};

const msg = (id: string, dir: "in" | "out", turn: string, text: string, kind = dir === "in" ? "text" : "reply") => ({
  message_id: id, direction: dir, sender: dir === "in" ? "owner" : "mimi", channel: "owner_console", shop_id: "", text, kind,
  status: dir === "in" ? "received" : "ready", turn_id: turn, simulated: false, at: AT,
});
const ho = (turn: string, to: string) => ({ event_id: `ho_${turn}`, turn_id: turn, run_id: "", type: "handoff", step: 0, tool: "", tier: "", short: `Asking ${to}`, model: "", cost_kobo: 0, duration_ms: 0, at: AT });
const turnRow = (turn: string, helper: string, status = "done") => ({ turn_id: turn, state: "done", status, helper, skill: `${helper}/x`, run_id: "", attempts: 1, simulated: false, created_at: AT, finished_at: AT });
const handoff = (turn: string, to: string, via: string) => ({ handoff_id: `ho_${turn}`, contract: "handoffs-2026-10-30.1", from_helper: "mimi", to_helper: to, to_title: to, skill: `${to}/x`, reason: "", via, hop: 0, status: "done" });

/* the live demo's one owner thread, as the API returns it after three turns:
   t1 typed in Collector's chat (assign), t2 typed in Mimi's chat and routed to Order, t3 a question from Credit */
const detail: ApiThreadDetail = {
  thread,
  state: {},
  messages: [
    msg("in:1", "in", "t1", "Who owes the most right now?"),
    msg("out:1", "out", "t1", "Mama Sola Provisions owes the most: N2,387,250 overdue."),
    msg("in:2", "in", "t2", "Any new orders today?"),
    msg("out:2", "out", "t2", "No shop order is waiting for you right now."),
    msg("in:3", "in", "t3", "Raise her limit"),
    msg("out:3", "out", "t3", "Do you mean raise the limit for Mama Sola Provisions?", "question"),
  ],
  steps: [ho("t1", "Collector"), ho("t2", "Order"), ho("t3", "Credit")],
  turns: [turnRow("t1", "collector"), turnRow("t2", "order"), turnRow("t3", "credit", "asked_question")],
  handoffs: [handoff("t1", "collector", "assign"), handoff("t2", "order", "rule"), handoff("t3", "credit", "assign")],
};

const texts = (list: Message[]) => list.filter((m) => m.kind !== "date").map((m) => (m.kind === "text" ? `${m.from}: ${m.text}` : m.kind === "step" ? `line: ${m.text}${m.result ? ` | ${m.result}` : ""}` : m.kind === "ask" ? `ask ${m.from}: ${m.question}` : m.kind));

test("routing: a message typed in helper X's chat targets X (assign_to), Mimi's chat lets Mimi route", () => {
  assert.equal(assignFor("Collector"), "collector");
  assert.equal(assignFor("Credit"), "credit");
  assert.equal(assignFor("Proof"), "proof");
  assert.equal(assignFor("Mimi"), undefined);
  assert.equal(assignFor(undefined), undefined);
});

test("routing: what X's chat sent and X's answer show in X's chat only, never in Mimi's", () => {
  const all = mapThread(detail, [], NOW).messages;
  const collector = texts(borrowedChat(all, "Collector"));
  assert.deepEqual(collector, ["me: Who owes the most right now?", "Collector: Mama Sola Provisions owes the most: ₦2,387,250 overdue."]);
  const mimi = texts(ownChat(all, "Mimi"));
  assert.ok(!mimi.some((l) => l.includes("Who owes the most")), "the Collector turn stays out of Mimi's chat");
  assert.ok(!mimi.some((l) => l.startsWith("Collector:")));
});

test("routing: a bubble typed in Collector's chat shows there before the API files it, not in Mimi's", () => {
  const pending: Message = { id: "p1", kind: "text", from: "me", text: "Remind Kola Mart", at: 1, to: "Collector" };
  assert.deepEqual(texts(borrowedChat([pending], "Collector")), ["me: Remind Kola Mart"]);
  assert.deepEqual(texts(ownChat([pending], "Mimi")), []);
  assert.deepEqual(texts(borrowedChat([pending], "Order")), []);
});

test("handoffs: Mimi's chat keeps one line with a one-line result; the work lives in Order's chat", () => {
  const all = mapThread(detail, [], NOW).messages;
  const mimi = texts(ownChat(all, "Mimi"));
  assert.deepEqual(mimi.slice(0, 2), ["me: Any new orders today?", "line: Handed to Order: any new orders today | No shop order is waiting for you right now."]);
  const order = texts(borrowedChat(all, "Order"));
  assert.deepEqual(order, ["line: From Mimi: Any new orders today?", "Order: No shop order is waiting for you right now."]);
});

test("handoffs in sample threads: Collector's chat folds Proof's work into the line; Proof's chat holds it", () => {
  const conv: Message[] = [
    { id: "a", kind: "text", from: "me", text: "Chase the late shops", at: 1 },
    { id: "b", kind: "step", from: "Collector", at: 2, variant: "handoff", to: "Proof", state: "done", text: "Collector asked **Proof** to check Ade Stores" },
    { id: "c", kind: "event", text: "Handed to Proof", at: 2 },
    { id: "d", kind: "text", from: "Proof", text: "Ade Stores already paid.", at: 3 },
    { id: "e", kind: "text", from: "Collector", text: "5 shops left. Here's the plan.", at: 4 },
  ];
  assert.deepEqual(texts(ownChat(conv, "Collector")), ["me: Chase the late shops", "line: Handed to Proof: check Ade Stores | Ade Stores already paid.", "Collector: 5 shops left. Here's the plan."]);
  assert.deepEqual(texts(borrowedChat(conv, "Proof", "Collector")), ["line: From Collector: check Ade Stores", "Proof: Ade Stores already paid."]);
  assert.equal(handoffTask("Order asked **Credit** about her limit"), "about her limit");
});

test("needs you: a helper's question is an ask, in her chat and in the list Mimi's chat reads", () => {
  const c = mapThread(detail, [], NOW);
  const credit = borrowedChat(c.messages, "Credit");
  assert.ok(credit.some((m) => m.kind === "ask" && m.from === "Credit"));
  const asks = asksIn([c]);
  assert.equal(asks.length, 1);
  assert.equal(asks[0]!.ask.question, "Do you mean raise the limit for Mama Sola Provisions?");
});

test("needs you: answered in Mimi's chat or in Credit's, the same answer reads in both", () => {
  const ask = asksIn([mapThread(detail, [], NOW)])[0]!.ask;
  /* nothing yet */
  assert.equal(askAnswer(ask, [], null, () => undefined), undefined);
  /* answered from Mimi's chat in this tab: both chats read the same local answer */
  const local = { text: "Yes, Mama Sola", at: 5, via: "mimi" as const };
  assert.deepEqual(askAnswer(ask, [], local), local);
  /* after a reload: the owner's next message to Credit is the answer, wherever it was typed */
  const after: Message[] = [
    { id: "x", kind: "text", from: "me", text: "Any new orders?", at: 6, turn: "t9" },
    { id: "y", kind: "text", from: "me", text: "Yes, Mama Sola", at: 7, turn: "t10" },
  ];
  const helperOf = (t: string) => ({ t9: "Order", t10: "Credit" })[t];
  assert.deepEqual(askAnswer(ask, after, null, helperOf), { text: "Yes, Mama Sola", at: 7, via: "helper" });
  /* sample asks carry their answer on the message itself */
  assert.equal(askAnswer({ ...ask, answered: { text: "No", at: 1, via: "helper" } }, [], local)?.text, "No");
});

test("a paused job reads in plain words with Keep going / Stop, no model or tool numbers", () => {
  const raw = "I paused collector: this job has used ₦32.56 of its ₦50.00 model budget and the next step could cost up to ₦29.06. So far: 5 tool calls and 1 proposals saved; nothing was dropped. Keep going?";
  const p = plainPause(raw)!;
  assert.ok(p, "recognised");
  assert.ok(!/model|tool|budget|₦|proposal/i.test(p.question), p.question);
  assert.deepEqual(p.options.map((o) => [o.label, o.text]), [["Keep going", "keep going"], ["Stop", "stop"]]);
  assert.ok(plainPause("I paused order after 12 steps (the limit is 12). So far: 12 tool calls and 0 proposals saved; nothing was dropped. Keep going?"));
  assert.equal(plainPause("Mama Sola owes the most."), null);
  /* in a thread it becomes Collector's ask with the two buttons */
  const d: ApiThreadDetail = { ...detail, messages: [msg("in:9", "in", "t1", "Chase them"), msg("out:9", "out", "t1", raw)], steps: [ho("t1", "Collector")], turns: [turnRow("t1", "collector")], handoffs: [handoff("t1", "collector", "assign")] };
  const ask = mapThread(d, [], NOW).messages.find((m) => m.kind === "ask");
  assert.ok(ask && ask.kind === "ask" && ask.from === "Collector" && ask.options?.length === 2);
});
