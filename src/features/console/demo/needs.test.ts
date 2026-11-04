/**
 * The needs screen's header and its decided list (5 Nov 2026: in a live rehearsal the owner approved
 * a shop payment, the API kept it, and the screen still said "All clear" under it). The console has
 * no React render harness, so the words the screen shows are asserted through the same pure helpers
 * it renders: a test of the strings, from one source.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { decidedItems, demoOnlyLine, needItems, needsHeadline, outcomeWords } from "./needs.ts";
import type { Conversation, DecisionCard, Message } from "./types.ts";

const T0 = Date.UTC(2026, 10, 5, 9, 0);
const at = (min: number) => T0 + min * 60_000;

const card = (over: Partial<DecisionCard> = {}): DecisionCard => ({
  kind: "zoho",
  title: "Record ₦34,950 from Mama Chidi Kiosk in Zoho Books",
  sub: "Payment the bank confirmed",
  rows: [],
  shop: "Mama Chidi Kiosk",
  amount: 34950,
  primary: "Record in Zoho",
  secondary: "Decline",
  status: "sent",
  doneText: "Recorded in Zoho",
  ...over,
});

const cardMsg = (id: string, c: DecisionCard): Message => ({ id, kind: "card", from: "Collector", at: at(0), card: c });

const conv = (messages: Message[]): Conversation =>
  ({
    slug: "demo:collector",
    title: "Collections",
    helper: "Collector",
    folder: "Collections",
    code: "MIM-001",
    state: "done",
    status: "done",
    working: false,
    ago: "now",
    preview: "",
    messages,
    created: true,
    api: { threadId: "demo:collector", kind: "owner", shopId: "", shopName: "" },
  }) as Conversation;

test("the header is all clear only when there is nothing at all", () => {
  assert.equal(needsHeadline({ when: "Morning", owner: "Tobi", waiting: 2, decided: 3 }), "Morning, Tobi. 2 things need you.");
  assert.equal(needsHeadline({ when: "Morning", owner: "Tobi", waiting: 1, decided: 0 }), "Morning, Tobi. 1 thing needs you.");
  assert.equal(needsHeadline({ when: "Morning", owner: "Tobi", waiting: 0, decided: 2 }), "Morning, Tobi. Nothing waiting for you. 2 decisions made.");
  assert.equal(needsHeadline({ when: "Morning", owner: "Tobi", waiting: 0, decided: 0 }), "All clear, Tobi.");
  assert.equal(
    needsHeadline({ when: "Evening", waiting: 0, decided: 0, busy: ["Collector", "Credit"] }),
    "All clear. Collector and Credit are working.",
  );
});

test("nothing waiting, with a decision on the record, is never all clear", () => {
  const head = needsHeadline({ when: "Morning", owner: "Tobi", waiting: 0, decided: 1 });
  assert.equal(head, "Morning, Tobi. Nothing waiting for you. 1 decision made.");
  assert.ok(!/all clear/i.test(head), head);
});

test("one approved and one rejected approval: off all clear, both in the decided list, newest first", () => {
  const conversations = [
    conv([
      cardMsg("apr:a1", card({ decidedAt: at(0) })),
      cardMsg("apr:a2", card({ status: "declined", declinedText: "Not recorded", decidedAt: at(30) })),
    ]),
  ];
  assert.equal(needItems(conversations).length, 0, "nothing waits on the owner");
  const decided = decidedItems(conversations);
  assert.equal(decided.length, 2);
  const head = needsHeadline({ when: "Morning", owner: "Tobi", waiting: 0, decided: decided.length });
  assert.ok(!/all clear/i.test(head), head);
  assert.equal(head, "Morning, Tobi. Nothing waiting for you. 2 decisions made.");
  assert.deepEqual(
    decided.map((d) => [outcomeWords(d.outcome), d.line, d.shop, d.amount, d.decidedAt]),
    [
      ["Declined", "Not recorded", "Mama Chidi Kiosk", 34950, at(30)],
      ["Approved", "Recorded in Zoho", "Mama Chidi Kiosk", 34950, at(0)],
    ],
  );
});

test("a demo-only write is said in words, never repeated as a real one", () => {
  const decided = decidedItems([conv([cardMsg("apr:a1", card({ demoOnly: true, decidedAt: at(0) }))])]);
  assert.equal(decided.length, 1);
  assert.equal(decided[0]!.line, demoOnlyLine);
  assert.equal(decided[0]!.line, "Demo only: no real record changed.");
  assert.notEqual(decided[0]!.line, "Recorded in Zoho");
  assert.equal(outcomeWords(decided[0]!.outcome), "Approved");
});

test("an approval taken back reads as undone, in the card's own words", () => {
  const decided = decidedItems([
    conv([cardMsg("apr:a1", card({ undo: { state: "done", text: "Taken back out of Zoho" }, decidedAt: at(0) }))]),
  ]);
  assert.equal(decided[0]!.outcome, "undone");
  assert.equal(outcomeWords("undone"), "Undone");
  assert.equal(decided[0]!.line, "Taken back out of Zoho");
});

test("a card still waiting on the owner stays in the pile, not in the decided list", () => {
  const conversations = [conv([cardMsg("apr:a1", card({ status: "needs" })), cardMsg("apr:a2", card({ status: "sending" }))])];
  assert.equal(decidedItems(conversations).length, 0);
  assert.equal(needItems(conversations).length, 2);
});

test("a decided card the API sent no time for keeps its place at the end", () => {
  const conversations = [
    conv([cardMsg("apr:a1", card({ decidedAt: at(0) })), cardMsg("apr:a2", card({ status: "declined", declinedText: "Not recorded" }))]),
  ];
  assert.deepEqual(
    decidedItems(conversations).map((d) => d.decidedAt),
    [at(0), 0],
  );
});
