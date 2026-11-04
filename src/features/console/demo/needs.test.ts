/**
 * The needs screen's header and its decided list (5 Nov 2026: in a live rehearsal the owner approved
 * a shop payment, the API kept it, and the screen still said "All clear" under it). The console has
 * no React render harness, so the words the screen shows are asserted through the same pure helpers
 * it renders: a test of the strings, from one source.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { decidedItems, needItems, needsHeadline } from "./needs.ts";
import { demoOnlyLine, outcomeWords } from "../content/decisions.ts";
import { mapApprovalCard } from "../api/mappers.ts";
import type { ApiApproval } from "../api/types.ts";
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
      ["Approved", "Recorded in Zoho Books against the invoice", "Mama Chidi Kiosk", 34950, at(0)],
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

test("the card and the decided row read the same words for one write", () => {
  /* one approval, mapped once, read by both surfaces: the card's done line and the row's line */
  const a: ApiApproval = {
    approval_id: "apr-1",
    status: "approved",
    helper: "proof",
    skill: "proof/confirm_payment",
    shop_id: "shop-035",
    thread_id: "demo-1:shop:shop-035",
    turn_id: "t1",
    tool: "record_zoho_payment",
    intent_kind: "zoho_payment",
    kind: "zoho_payment",
    preview: "Record ₦34,950 from Mama Chidi Kiosk in Zoho Books",
    payload: { kind: "zoho_payment", shop_name: "Mama Chidi Kiosk", amount_ngn: 34950 },
    draft: null,
    created_at: "2026-11-05T09:00:00+01:00",
    decided_at: "2026-11-05T09:10:00+01:00",
    decided_by: "owner",
    note: "",
    supersedes: null,
    superseded_by: null,
    result: { zoho_payment_id: "zfake_5f3a91", demo: true, undo_available: true },
  };
  const card = mapApprovalCard(a, "Mama Chidi Kiosk")!;
  const row = decidedItems([conv([cardMsg("apr:apr-1", card)])])[0]!;
  assert.equal(card.doneText, "Demo only: no real record changed.");
  assert.equal(row.line, card.doneText);
  assert.ok(!JSON.stringify(card).includes("Recorded in Zoho"));
  /* and a real write, on the same path: the book it landed in, and what it went against */
  const real = mapApprovalCard({ ...a, approval_id: "apr-2", result: { zoho_payment_id: "zp_1", undo_available: true } }, "Mama Chidi Kiosk")!;
  assert.equal(real.doneText, "Recorded in Zoho Books against the invoice");
  assert.equal(decidedItems([conv([cardMsg("apr:apr-2", real)])])[0]!.line, real.doneText);
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
