/**
 * The sidebar's helper rows in the live demo (30 Oct 2026 distributor test: rows stayed "Nothing
 * yet" after a helper answered in the owner's shared thread with Mimi, and a tap did nothing).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { helperActivity, helperExchange, needsLine, previewOf } from "./helper-activity.ts";
import type { Conversation, Message } from "../demo/types.ts";

const T0 = Date.UTC(2026, 9, 30, 17, 0);
const min = (n: number) => T0 + n * 60_000;

const messages: Message[] = [
  { id: "d", kind: "date", label: "Today" },
  { id: "m1", kind: "text", from: "me", text: "Good morning Mimi", at: min(0) },
  { id: "r1", kind: "text", from: "Mimi", text: "Good morning! What should we check?", at: min(1) },
  { id: "m2", kind: "text", from: "me", text: "Who owes me the most?", at: min(2) },
  { id: "h2", kind: "event", text: "Asking Collector", at: min(2) },
  { id: "s2", kind: "step", from: "Collector", at: min(2), variant: "tool", text: "Read invoices", state: "done" },
  { id: "r2", kind: "text", from: "Collector", text: "**Mama Sola Provisions** owes ₦2,387,250, 45 days late.", at: min(3) },
  { id: "m3", kind: "text", from: "me", text: "Is Iya Bisi's alert real?", at: min(4) },
  { id: "r3", kind: "text", from: "Proof", text: "Which shop is Iya Bisi?", at: min(5) },
  { id: "m4", kind: "text", from: "me", text: "And the next one?", at: min(6) },
];

const conv = (over: Partial<Conversation> = {}): Conversation => ({
  slug: "demo:owner",
  title: "You and Mimi",
  helper: "Mimi",
  folder: "General",
  code: "MIM-000",
  state: "done",
  status: "done",
  working: false,
  ago: "now",
  preview: "",
  messages,
  created: true,
  api: { threadId: "demo:owner", kind: "owner", shopId: "", shopName: "" },
  ...over,
} as Conversation);

test("a helper's row reads her own lines in the shared thread", () => {
  const c = helperActivity([conv()], "Collector", min(0));
  assert.equal(c.count, 1);
  assert.equal(c.last?.text, "Mama Sola Provisions owes ₦2,387,250, 45 days late.");
  assert.equal(c.last?.at, min(3));
  assert.equal(c.slug, "demo:owner");
  assert.equal(c.unread, 1);
  /* opened after her answer: nothing new */
  assert.equal(helperActivity([conv()], "Collector", min(3)).unread, 0);
  /* before the API data showed, nothing counts as unread */
  assert.equal(helperActivity([conv()], "Collector", Number.POSITIVE_INFINITY).unread, 0);
  /* a helper who has said nothing */
  const s = helperActivity([conv()], "Stock", 0);
  assert.equal(s.last, null);
  assert.equal(s.count, 0);
  assert.equal(s.slug, undefined);
});

test("previews are one plain line and skip work lines, dates and events", () => {
  assert.equal(previewOf({ id: "x", kind: "text", from: "Credit", text: "- **Limit** [Shop](https://x.y) ok\n\nnext", at: 0 }), "Limit Shop ok next");
  assert.equal(previewOf({ id: "x", kind: "event", text: "Asking Collector", at: 0 }), null);
  assert.equal(previewOf({ id: "x", kind: "date", label: "Today" }), null);
  assert.equal(previewOf({ id: "x", kind: "step", from: "Order", at: 0, variant: "tool", text: "Read", state: "done" }), null);
  assert.equal(previewOf({ id: "x", kind: "answer", from: "Order", at: 0, blocks: [{ type: "text", text: "Two orders wait." }] }), "Two orders wait.");
});

test("her side of the shared thread: her answers with the asks before them, and the newest open ask", () => {
  const col = helperExchange(messages, "Collector").map((m) => m.id);
  assert.deepEqual(col, ["d", "m2", "h2", "r2", "m4"]);
  const proof = helperExchange(messages, "Proof").map((m) => m.id);
  assert.deepEqual(proof, ["d", "m3", "r3", "m4"]);
  /* nobody else's answers, and nothing from a helper who has not answered (except the open ask) */
  assert.deepEqual(helperExchange(messages, "Stock").map((m) => m.id), ["d", "m4"]);
  assert.deepEqual(helperExchange(messages.slice(0, 9), "Stock"), []);
});

test("a refused send keeps its bubble and note at the end of her side", () => {
  const capped: Message[] = [
    ...messages.slice(0, 9),
    { id: "m5", kind: "text", from: "me", text: "Chase them", at: min(7) },
    { id: "cap", kind: "event", text: "Not sent. You've used today's demo budget.", at: min(7), tone: "stop" },
  ];
  assert.deepEqual(helperExchange(capped, "Collector").slice(-2).map((m) => m.id), ["m5", "cap"]);
});

test("needs line is plural only when it should be", () => {
  assert.equal(needsLine(1), "1 waiting on you");
  assert.equal(needsLine(3), "3 waiting on you");
  assert.equal(needsLine(0), "0 waiting on you");
});
