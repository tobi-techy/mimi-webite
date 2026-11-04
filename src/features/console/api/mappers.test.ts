/**
 * Mapper tests: `npm run test:console` (node:test with Node's own type stripping, no new
 * dependency). Fixtures are trimmed copies of real responses from a local MIMI-AGENT API in demo
 * mode with the offline model (feat/console-api-demo-mode, 29 Oct 2026).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agoLabel,
  briefLines,
  cardKindOf,
  clockLabel,
  errorKind,
  friendlyMessage,
  gradeOf,
  helperOf,
  liveActivity,
  mapApprovalCard,
  mapCreditLines,
  mapCreditRecs,
  mapExposure,
  mapReturn,
  mapReturns,
  mapShop,
  mapThread,
  mapThreadSummary,
  parseApiTime,
  payloadAmount,
  shopStatusOf,
  stateOf,
} from "./mappers.ts";
import { personOf } from "../content/returns.ts";
import type { ApiExposure, ApiReturn } from "./types.ts";
import type { ApiApproval, ApiCredit, ApiShop, ApiShopDetail, ApiThreadDetail, ApiThreadSummary } from "./types.ts";

const NOW = Date.UTC(2026, 9, 29, 9, 45); // 10:45 WAT

const ownerThread: ApiThreadSummary = {
  thread_id: "demo-c1032614f1aa7d94:owner",
  kind: "owner",
  shop_id: "",
  shop_name: "",
  last_at: "Thu 2026-10-29 10:39 AM WAT (UTC+01:00)",
  last_text: "Thanks, I have your message. I'm running in offline demo mode, so a person will follow up.",
  last_sender: "mimi",
  messages: 2,
  pending_approvals: 0,
  helper: "collector",
  helper_name: "Collector",
  status: "done",
  title: "You and Mimi",
};

const shopThread: ApiThreadSummary = {
  ...ownerThread,
  thread_id: "demo-b16a9916ec282109:shop:shop-001",
  kind: "shop",
  shop_id: "shop-001",
  shop_name: "Mama Sola Provisions",
  title: "Mama Sola Provisions: Payment check",
};

const shop: ApiShop = {
  shop_id: "shop-001",
  name: "Mama Sola Provisions",
  owner: "Sola Adesina",
  area: "Oja Oba",
  shop_type: "provision store",
  size: "big",
  rep_id: "rep-1",
  phone_last4: "***0100",
  credit_limit_kobo: 170000000,
  credit_limit_naira: "N1,700,000",
  outstanding_kobo: 349730000,
  outstanding_naira: "N3,497,300",
  overdue_kobo: 238725000,
  overdue_naira: "N2,387,250",
  open_invoices: 14,
  simulated: true,
};

const approval: ApiApproval = {
  approval_id: "apr_1",
  status: "pending",
  helper: "proof",
  skill: "proof/fake-alert-check",
  shop_id: "shop-001",
  thread_id: shopThread.thread_id,
  turn_id: "turn_1",
  tool: "flag_payment_proof",
  intent_kind: "flag_payment_proof",
  preview: "Flag Mama Sola's ₦50,000 transfer screenshot\nNo match in the bank feed",
  payload: { amount_kobo: 5000000 },
  draft: { text: "We could not find this payment yet.", channel: "whatsapp", status: "pending_approval" },
  created_at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
  decided_at: null,
  decided_by: null,
  note: "",
  supersedes: null,
  superseded_by: null,
};

test("parseApiTime reads the API's display time with its offset", () => {
  assert.equal(parseApiTime("Thu 2026-10-29 10:39 AM WAT (UTC+01:00)"), Date.UTC(2026, 9, 29, 9, 39));
  assert.equal(parseApiTime("Thu 2026-10-29 12:05 PM WAT (UTC+01:00)"), Date.UTC(2026, 9, 29, 11, 5));
  assert.equal(parseApiTime("Thu 2026-10-29 12:05 AM WAT (UTC+01:00)"), Date.UTC(2026, 9, 28, 23, 5));
  assert.equal(parseApiTime("2026-10-24"), Date.UTC(2026, 9, 24, 12));
  assert.equal(parseApiTime(""), null);
  assert.equal(parseApiTime("not a time"), null);
});

test("agoLabel and clockLabel match the console's own forms", () => {
  assert.equal(agoLabel(NOW - 30_000, NOW), "now");
  assert.equal(agoLabel(NOW - 6 * 60_000, NOW), "6m");
  assert.equal(agoLabel(NOW - 3 * 3600_000, NOW), "3h");
  assert.equal(agoLabel(NOW - 2 * 86400_000, NOW), "2d");
  assert.equal(clockLabel(Date.UTC(2026, 9, 29, 9, 39)), "10:39");
  assert.equal(clockLabel(Date.UTC(2026, 9, 29, 13, 5)), "2:05");
});

test("helpers and states map to the console's names", () => {
  assert.equal(helperOf("collector"), "Collector");
  assert.equal(helperOf("Proof"), "Proof");
  assert.equal(helperOf("brand/promo-info"), "Brand");
  assert.equal(helperOf(""), "Mimi");
  assert.equal(helperOf("someone-new"), "Mimi");
  assert.equal(stateOf("needs_you"), "needs");
  assert.equal(stateOf("running"), "run");
  assert.equal(stateOf("done"), "done");
});

test("the owner's thread is always Mimi's, even after Collector answered", () => {
  const c = mapThreadSummary(ownerThread, NOW);
  assert.equal(c.helper, "Mimi");
  assert.equal(c.slug, ownerThread.thread_id);
  assert.equal(c.created, true);
  assert.equal(c.ago, "6m");
  assert.equal(c.state, "done");
  assert.equal(c.api?.kind, "owner");
  assert.equal(c.messages[0]?.kind, "date");
});

test("a shop thread follows its helper and keeps the code-written title", () => {
  const c = mapThreadSummary({ ...shopThread, status: "needs_you" }, NOW);
  assert.equal(c.helper, "Collector");
  assert.equal(c.folder, "Collections");
  assert.equal(c.code, "COL-001");
  assert.equal(c.title, "Mama Sola Provisions: Payment check");
  assert.equal(c.state, "needs");
  assert.equal(c.status, "waiting on you");
});

const detail: ApiThreadDetail = {
  thread: shopThread,
  state: {},
  messages: [
    {
      message_id: "in:c-1",
      direction: "in",
      sender: "shop",
      channel: "",
      shop_id: "shop-001",
      text: "I don pay 50k by transfer",
      kind: "text",
      status: "received",
      turn_id: "turn_1",
      simulated: false,
      at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
    },
    {
      message_id: "out:ik_1",
      direction: "out",
      sender: "mimi",
      channel: "whatsapp",
      shop_id: "shop-001",
      text: "Thanks, I'm checking it now.",
      kind: "reply",
      status: "ready",
      turn_id: "turn_1",
      simulated: false,
      at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
    },
    {
      message_id: "out:ik_2",
      direction: "out",
      sender: "mimi",
      channel: "whatsapp",
      shop_id: "shop-001",
      text: "We could not find this payment yet.",
      kind: "reply",
      status: "pending_approval",
      turn_id: "turn_1",
      simulated: false,
      at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
    },
  ],
  steps: [
    {
      event_id: "ev1",
      turn_id: "turn_1",
      run_id: "run_1",
      type: "tool",
      step: 1,
      tool: "check_payment_screenshot",
      tier: "auto",
      short: "Checked the screenshot against the bank feed",
      model: "",
      cost_kobo: 150,
      duration_ms: 1234,
      at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
    },
  ],
  turns: [
    {
      turn_id: "turn_1",
      state: "done",
      status: "done",
      helper: "proof",
      skill: "proof/fake-alert-check",
      run_id: "run_1",
      attempts: 1,
      simulated: false,
      created_at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
      finished_at: "Thu 2026-10-29 10:40 AM WAT (UTC+01:00)",
    },
  ],
};

test("mapThread files a shop thread as a task: task line, folded work, reply line, then the approval card", () => {
  const c = mapThread(detail, [approval], NOW);
  const kinds = c.messages.map((m) => m.kind);
  assert.deepEqual(kinds, ["date", "system", "thought", "system", "card"]);
  const [, shopMsg, work, reply, card] = c.messages;
  /* the shop's own words never show in the console (Tobi, 3 Nov 2026) */
  assert.ok(shopMsg?.kind === "system" && shopMsg.text === "Task from Mama Sola Provisions");
  assert.ok(!JSON.stringify(c.messages).includes("I don pay 50k"));
  assert.ok(work?.kind === "thought" && work.from === "Proof" && work.secs === 1 && work.text === "- Checked the screenshot against the bank feed");
  assert.ok(reply?.kind === "system" && reply.text === "Proof replied to Mama Sola Provisions");
  assert.ok(card?.kind === "card" && card.id === "apr:apr_1" && card.card.status === "needs" && card.card.kind === "flag");
  /* the drafted reply waits in the card, not as a line */
  assert.equal(c.messages.filter((m) => m.kind === "system").length, 2);
  assert.equal(c.state, "needs");
});

test("a running turn shows its steps one by one, with timing and cost", () => {
  const live = { ...detail, messages: detail.messages.slice(0, 1), turns: [{ ...detail.turns[0]!, state: "running", finished_at: null }] };
  const c = mapThread(live, [], NOW);
  const step = c.messages.find((m) => m.kind === "step");
  assert.ok(step?.kind === "step" && step.from === "Proof" && step.took === "1.2s" && step.cost === 1.5 && step.state === "done");
  assert.equal(liveActivity(live), "Checked the screenshot against the bank feed");
  assert.equal(liveActivity(detail), null);
});

test("mapThread keeps a just-sent owner message until the API has it", () => {
  const mine = { id: "api-me1", kind: "text" as const, from: "me" as const, text: "Who owes me the most?", at: NOW };
  const c = mapThread({ ...detail, thread: ownerThread, messages: [], steps: [], turns: [] }, [], NOW, [mine]);
  assert.equal(c.messages.at(-1)?.id, "api-me1");
  assert.equal(c.state, "run");
  assert.equal(c.status, "reading your message");
  const stored = mapThread(
    { ...detail, thread: ownerThread, messages: [{ ...detail.messages[0]!, sender: "owner", text: mine.text }], steps: [], turns: [] },
    [],
    NOW,
    [mine],
  );
  assert.equal(stored.messages.filter((m) => m.kind === "text" && m.from === "me").length, 1);
});

test("approval cards: kinds, amounts, statuses, and nothing for superseded ones", () => {
  assert.equal(cardKindOf("draft_restock"), "stock");
  assert.equal(cardKindOf("submit_credit_review"), "credit");
  assert.equal(cardKindOf("raise_daily_allowance"), "credit");
  assert.equal(cardKindOf("draft_brand_email"), "brand");
  assert.equal(cardKindOf("flag_delivery_to_owner"), "order");
  assert.equal(payloadAmount({ amount_kobo: 5000000 }), 50000);
  assert.equal(payloadAmount({ qty: 3 }), undefined);
  const card = mapApprovalCard(approval, "Mama Sola Provisions");
  assert.ok(card);
  assert.equal(card.title, "Flag Mama Sola's ₦50,000 transfer screenshot");
  assert.equal(card.amount, 50000);
  assert.equal(card.secondary, "Decline");
  assert.equal(mapApprovalCard({ ...approval, status: "approved", decided_at: "Thu 2026-10-29 10:42 AM WAT (UTC+01:00)" }, "")?.status, "sent");
  assert.equal(mapApprovalCard({ ...approval, status: "rejected" }, "")?.status, "declined");
  assert.equal(mapApprovalCard({ ...approval, status: "superseded" }, ""), null);
  assert.equal(mapApprovalCard({ ...approval, status: "withdrawn" }, ""), null);
});

test("mapShop uses kobo to naira and invents nothing", () => {
  const s = mapShop(shop);
  assert.equal(s.owed, 3497300);
  assert.equal(s.route, "Rep 1");
  assert.equal(s.whatsapp, "ending 0100");
  assert.equal(s.status, "o");
  assert.equal(s.lastPayment, "—");
  assert.equal(s.live?.creditLimit, 1700000);
  assert.equal(s.live?.overdue, 2387250);
  assert.equal(s.live?.openInvoices, 14);
  assert.equal(shopStatusOf({ overdue_kobo: 0, outstanding_kobo: 90, credit_limit_kobo: 100 }), "w");
  assert.equal(shopStatusOf({ overdue_kobo: 0, outstanding_kobo: 10, credit_limit_kobo: 100 }), "g");
});

test("mapShop with detail: payments, open invoices and disputes", () => {
  const d: ApiShopDetail = {
    shop,
    thread_id: shopThread.thread_id,
    receivables: [
      { delivery_id: "dlv-04-0001", due_on: "2026-09-11", days_overdue: 45, total_kobo: 49560000, paid_kobo: 44500000, outstanding_kobo: 5060000, status: "overdue" },
      { delivery_id: "dlv-paid", due_on: "2026-09-12", days_overdue: 0, total_kobo: 100, paid_kobo: 100, outstanding_kobo: 0, status: "paid" },
    ],
    payments: [{ payment_id: "pay-00342", paid_on: "2026-10-24", amount_kobo: 50500000, claimed_kobo: 50500000, method: "transfer", status: "matched", bank_confirmed: true }],
    promises: [],
    deliveries: [],
    disputes: [{ dispute_id: "dsp-0000", delivery_id: "dlv-22-0006", sku: "NDL-70-CTN", missing: 2, text: "I didn't collect the 2 cartons", status: "open" }],
  };
  const s = mapShop(shop, d);
  assert.deepEqual(s.payments, [{ date: "Oct 24", amount: 505000, verified: true, proof: "verified" }]);
  assert.equal(s.lastPayment, "Oct 24");
  assert.deepEqual(s.live?.receivables, [{ id: "dlv-04-0001", due: "Sep 11", daysOverdue: 45, outstanding: 50600 }]);
  assert.deepEqual(s.live?.disputes, ["I didn't collect the 2 cartons"]);
  assert.equal(s.live?.threadId, shopThread.thread_id);
});

test("credit lines and requests", () => {
  const c: ApiCredit = {
    limits: [{ shop_id: "shop-001", name: "Mama Sola Provisions", credit_limit_kobo: 170000000, outstanding_kobo: 349730000, available_kobo: 0, used_pct: 205 }],
    requests: [
      { request_id: "cr1", shop_id: "shop-001", amount_kobo: 20000000, amount_naira: "N200,000", reason: "Shelf full, pays on time", status: "pending", approval_id: "apr_9", created_at: "" },
      { request_id: "cr2", shop_id: "shop-001", amount_kobo: 1, amount_naira: "N0", reason: "", status: "rejected", approval_id: "apr_8", created_at: "" },
    ],
  };
  const lines = mapCreditLines(c, [mapShop(shop)]);
  assert.equal(lines.length, 1);
  assert.equal(lines[0]?.limit, 1700000);
  assert.equal(lines[0]?.late, true);
  assert.equal(lines[0]?.due, "Overdue");
  assert.equal(lines[0]?.recommendation, "Raise to ₦200,000");
  assert.deepEqual(mapCreditRecs(c), [{ shopId: "shop-001", to: 200000, verb: "Raise", why: "Shelf full, pays on time", approvalId: "apr_9" }]);
});

test("errors read as plain words, with no em dashes", () => {
  assert.equal(errorKind(0), "unreachable");
  assert.equal(errorKind(401, "demo session expired: start a new one"), "expired");
  assert.equal(errorKind(401, "a valid bearer key is required"), "unauthorized");
  assert.equal(errorKind(403, "the demo never raises a credit limit"), "refused");
  assert.equal(errorKind(429, "you have used today's demo allowance"), "capped");
  assert.equal(errorKind(429, "too many demo sessions from this address today"), "sessions");
  assert.equal(errorKind(503, "the demo is paused right now"), "paused");
  assert.match(friendlyMessage("capped", "the demo has used today's allowance for everyone"), /for everyone/);
  for (const k of ["unreachable", "expired", "unauthorized", "refused", "capped", "sessions", "paused", "conflict", "notfound", "other"] as const) {
    assert.ok(!friendlyMessage(k).includes("—"), k);
  }
});

/* ---------- voice notes and attachments (items 9 and 10) ---------- */

const ownerMsg = (over: Partial<ApiThreadDetail["messages"][number]>): ApiThreadDetail["messages"][number] => ({
  ...detail.messages[0]!,
  sender: "owner",
  shop_id: "",
  turn_id: "turn_9",
  ...over,
});

test("a reply that went as a voice note gets a playable note under its text, fetched by message id", () => {
  const spoken = { ...detail.messages[1]!, channel: "owner_console", voice: true };
  /* a voice note to a shop is part of the shop's conversation: it never shows */
  assert.equal(mapThread({ ...detail, messages: [detail.messages[0]!, spoken] }, [], NOW).messages.filter((m) => m.kind === "voice").length, 0);
  const c = mapThread({ ...detail, thread: ownerThread, messages: [detail.messages[0]!, spoken] }, [], NOW);
  const i = c.messages.findIndex((m) => m.kind === "text");
  const note = c.messages[i + 1];
  assert.ok(note?.kind === "voice" && note.from === "Proof");
  assert.deepEqual(note.audio, { from: "voice", id: "out:ik_1" });
  /* no token, no URL: only the message id travels; the client adds the header */
  assert.ok(!JSON.stringify(note).includes("http") && !JSON.stringify(note).includes("Bearer"));
  /* a drafted reply never shows a voice note */
  const draft = { ...detail.messages[2]!, voice: true };
  assert.equal(mapThread({ ...detail, messages: [draft] }, [], NOW).messages.filter((m) => m.kind === "voice").length, 0);
});

test("the owner's own attachments map to a photo, a voice note and a document read through the API", () => {
  const msgs = [
    ownerMsg({ message_id: "in:console-a", kind: "image", text: "[image]", media: true }),
    ownerMsg({ message_id: "in:console-b", kind: "voice", text: "[voice]", media: true }),
    ownerMsg({ message_id: "in:console-c", kind: "document", text: "[document]", media: true }),
    ownerMsg({ message_id: "in:wa-1", kind: "image", text: "[image]", media: false }),
  ];
  const c = mapThread({ ...detail, thread: ownerThread, messages: msgs, steps: [], turns: [] }, [], NOW);
  const [, photo, voice, doc, other] = c.messages;
  assert.ok(photo?.kind === "photos" && photo.remote === "in:console-a" && photo.photos.length === 0 && photo.from === "me");
  assert.ok(voice?.kind === "voice" && voice.audio?.from === "media" && voice.audio.id === "in:console-b" && !voice.transcript);
  assert.ok(doc?.kind === "file" && doc.remote === "in:console-c");
  /* media the API did not keep (a channel ref) is a plain line, and "[image]" never shows as a bubble */
  assert.ok(other?.kind === "system" && other.text === "You sent a photo");
  assert.ok(!c.messages.some((m) => m.kind === "text" && /^\[/.test(m.text)));
});

test("an attachment sent from this tab keeps its preview and never shows twice", () => {
  const mine = { id: "api-att1", kind: "photos" as const, from: "me" as const, at: NOW, label: "1 Photo", photos: ["blob:x"], apiId: "in:console-a" };
  const sending = { ...mine, upload: { state: "sending" as const, progress: 1 } };
  const empty = { ...detail, thread: ownerThread, messages: [], steps: [], turns: [] };
  /* not stored yet: shown, and the thread is working */
  const a = mapThread(empty, [], NOW, [sending]);
  assert.equal(a.messages.at(-1)?.id, "api-att1");
  assert.equal(a.state, "run");
  /* still uploading or failed: shown, but nothing is running yet */
  const up = mapThread(empty, [], NOW, [{ ...mine, upload: { state: "uploading" as const, progress: 0.4 } }]);
  assert.equal(up.messages.at(-1)?.id, "api-att1");
  assert.notEqual(up.state, "run");
  const failed = mapThread(empty, [], NOW, [{ ...mine, upload: { state: "failed" as const, progress: 0, error: "x" } }]);
  assert.equal(failed.messages.at(-1)?.id, "api-att1");
  assert.notEqual(failed.state, "run");
  /* stored: the API's copy is replaced by the local one (blob preview), once */
  const stored = mapThread({ ...empty, messages: [ownerMsg({ message_id: "in:console-a", kind: "image", text: "[image]", media: true })] }, [], NOW, [mine], new Map([["in:console-a", mine]]));
  const photos = stored.messages.filter((m) => m.kind === "photos");
  assert.equal(photos.length, 1);
  assert.ok(photos[0]?.kind === "photos" && photos[0].photos[0] === "blob:x");
});

/* ---------- demo wiring (API-CONTRACT.md, 2 Nov 2026) ---------- */

test("proof grade: proof_grade first, then the stored proof_level, then bank_confirmed", () => {
  assert.equal(gradeOf({ proof_grade: "estimated", proof_level: "verified" }), "estimated");
  assert.equal(gradeOf({ proof_level: "likely" }), "estimated");
  assert.equal(gradeOf({ proof_level: "estimated" }), "unverified");
  assert.equal(gradeOf({ bank_confirmed: true }), "verified");
  assert.equal(gradeOf({}), "unverified");
});

test("zoho_payment approval: a plain Record card, then Recorded in Zoho with Undo, then undone", () => {
  const a: ApiApproval = {
    ...approval,
    kind: "zoho_payment",
    payload: { kind: "zoho_payment", shop_name: "Mama Chidi Kiosk", amount_ngn: 34950, invoice_number: "INV-56-9034", reference_number: "mimi-zp-1", payment_id: "p", shop_id: "shop-035" },
  };
  const pending = mapApprovalCard({ ...a, status: "pending" }, "")!;
  assert.equal(pending.kind, "zoho");
  assert.equal(pending.title, "Record ₦34,950 from Mama Chidi Kiosk in Zoho Books");
  assert.equal(pending.labels?.primary, "Record in Zoho");
  assert.ok(!JSON.stringify(pending).includes("mimi-zp-1"), "no internal reference in the card");
  const done = mapApprovalCard({ ...a, status: "approved", result: { zoho_payment_id: "z", undo_available: true, demo: true } }, "")!;
  assert.equal(done.status, "sent");
  assert.equal(done.doneText, "Recorded in Zoho");
  assert.deepEqual(done.undo, { state: "ready" });
  const back = mapApprovalCard({ ...a, status: "approved", result: { zoho_payment_id: "z", undo_available: false, undone_at: "2026-11-03T08:00:00Z" } }, "")!;
  assert.equal(back.undo?.state, "done");
});

test("credit_over_limit approval: reasons, Approve new limit / Keep limit, Undo by change id", () => {
  const a: ApiApproval = {
    ...approval,
    kind: "credit_over_limit",
    blocked: true,
    payload: { kind: "credit_over_limit", shop_name: "Yemisi & Sons Mini Mart", order_ngn: 120000, limit_ngn: 630000, owed_ngn: 770200, suggested_limit_ngn: 900000, reasons: ["Owes N770,200 now.", "₦635,500 is overdue."] },
  };
  const c = mapApprovalCard({ ...a, status: "pending" }, "")!;
  assert.equal(c.kind, "limit");
  assert.deepEqual(c.labels, { primary: "Approve new limit", secondary: "Keep limit" });
  assert.deepEqual(c.reasons, ["Owes ₦770,200 now.", "₦635,500 is overdue."]);
  const ok = mapApprovalCard({ ...a, status: "approved", result: { change_id: "lch_1", old_limit_ngn: 630000, new_limit_ngn: 900000, undo_available: true } }, "")!;
  assert.equal(ok.doneText, "Limit now ₦900,000");
  assert.deepEqual(ok.undo, { state: "ready", changeId: "lch_1" });
  const undone = mapApprovalCard({ ...a, status: "approved", result: { change_id: "lch_1", old_limit_ngn: 630000, new_limit_ngn: 900000, undo_available: true } }, "", new Set(["lch_1"]))!;
  assert.deepEqual(undone.undo, { state: "done", text: "Limit back to ₦630,000" });
  assert.equal(mapApprovalCard({ ...a, status: "rejected" }, "")!.declinedText, "Limit kept");
});

test("morning brief: one overdue shop per line; other text unchanged", () => {
  const t = "Good morning. Top overdue: Mama Sola Provisions is 133 days overdue on ₦2,387,250; Funke & Sons Mini Mart is 45 days overdue on ₦1,070,050. In all ₦7,231,000 is overdue across 14 shops.";
  assert.equal(
    briefLines(t),
    "Good morning.\n\nTop overdue:\n• Mama Sola Provisions is 133 days overdue on ₦2,387,250\n• Funke & Sons Mini Mart is 45 days overdue on ₦1,070,050\n\nIn all ₦7,231,000 is overdue across 14 shops.",
  );
  assert.equal(briefLines("Good morning, nothing is overdue."), "Good morning, nothing is overdue.");
});

test("outShown: a shop sees only ready replies; drafts and declined ones never show", async () => {
  const { outShown } = await import("./mappers.ts");
  const shop = (status: string) => ({ direction: "out", channel: "shop_whatsapp", status });
  assert.equal(outShown(shop("ready")), true);
  for (const s of ["pending_approval", "draft", "rejected", "superseded", "queued", ""]) assert.equal(outShown(shop(s)), false, s);
  assert.equal(outShown({ direction: "out", channel: "owner_console", status: "ready" }), true);
  assert.equal(outShown({ direction: "out", channel: "owner_console", status: "rejected" }), false);
  assert.equal(outShown({ direction: "in", channel: "", status: "received" }), true);
});

/* ---------- returns and exposure (contract published 3 Nov 2026) ---------- */

const credit = (over: Partial<ApiApproval> & { payload?: Record<string, unknown> } = {}): ApiApproval => ({
  ...approval,
  kind: "return_credit",
  tool: "return_credit",
  ...over,
});

test("a return_credit approval is a plain credit card, the same shape as the Zoho record", () => {
  const a = credit({
    payload: {
      kind: "return_credit",
      shop_name: "Mama Chidi Kiosk",
      amount_kobo: 3495000,
      amount_ngn: 34950,
      reason: "Six cartons came back dented.",
      applied_kobo: 2000000,
      on_account_kobo: 1495000,
      invoices: [{ invoice_number: "INV-56-9034", amount_applied_kobo: 2000000 }],
      date: "2026-11-03",
    },
  });
  const pending = mapApprovalCard({ ...a, status: "pending" }, "")!;
  assert.equal(pending.kind, "return");
  assert.equal(pending.title, "Credit ₦34,950 to Mama Chidi Kiosk");
  assert.deepEqual(pending.labels, { primary: "Approve credit", secondary: "Not now" });
  assert.deepEqual(pending.reasons, ["Six cartons came back dented."]);
  assert.equal(pending.undo, undefined, "nothing to undo until the owner approves");
  assert.ok(!JSON.stringify(pending).includes("INV-56-9034"), "the invoice key is never shown");
  const done = mapApprovalCard(
    { ...a, status: "approved", result: { credit_id: "cr_1", applied_kobo: 2000000, on_account_kobo: 1495000, undo_available: true, applied_at: "2026-11-03T09:00:00Z" } },
    "",
  )!;
  assert.equal(done.status, "sent");
  assert.equal(done.doneText, "Credit applied");
  assert.deepEqual(done.undo, { state: "ready" });
  const back = mapApprovalCard(
    { ...a, status: "approved", result: { credit_id: "cr_1", applied_kobo: 2000000, on_account_kobo: 1495000, undo_available: false, undone_at: "2026-11-03T10:00:00Z" } },
    "",
  )!;
  assert.equal(back.undo?.state, "done");
});

test("a credit with nothing to set it against is held on the account, never called applied", () => {
  const a = credit({ payload: { kind: "return_credit", shop_name: "Yemisi & Sons", amount_kobo: 1200000, applied_kobo: 0, on_account_kobo: 1200000, invoices: [] } });
  const done = mapApprovalCard(
    { ...a, status: "approved", result: { credit_id: "cr_2", applied_kobo: 0, on_account_kobo: 1200000, undo_available: true } },
    "",
  )!;
  assert.equal(done.doneText, "Held on the account");
  assert.ok(done.rows.some((r) => r.label === "Held on the account" && r.amount === 12000));
  /* and no nought row claiming it went against an invoice */
  assert.equal(done.rows.some((r) => r.label.includes("oldest open invoice")), false);
});

test("no Undo button unless the API says the credit can still be taken back", () => {
  const a = credit({ payload: { kind: "return_credit", shop_name: "Sule & Co", amount_kobo: 500000, applied_kobo: 500000, on_account_kobo: 0 } });
  const done = mapApprovalCard({ ...a, status: "approved", result: { credit_id: "cr_3", applied_kobo: 500000, on_account_kobo: 0, undo_available: false } }, "")!;
  assert.equal(done.undo, undefined);
});

test("cardKindOf reads a returns credit as its own kind, not as a credit limit", () => {
  assert.equal(cardKindOf("return_credit"), "return");
  assert.equal(cardKindOf("apply_credit_note"), "return");
  assert.equal(cardKindOf("set_credit_limit"), "credit");
});

const apiReturn: ApiReturn = {
  return_id: "ret_1",
  shop_id: "shop-001",
  shop_name: "Mama Sola Provisions",
  source: "slow_stock",
  reason: "Eight cartons expired before they sold.",
  status: "inspected",
  lines: [
    {
      item: "Indomie Super Pack",
      unit: "carton",
      quantity_drafted: 10,
      quantity_collected: 9,
      quantity_returned: 8,
      reason: "Expired",
      unit_price_kobo: 1500000,
      value_drafted_kobo: 15000000,
      value_returned_kobo: 12000000,
      condition: "expired",
      disposition: "write_off",
      expires_on: "2026-10-20",
      expiry_source: "invoice",
      batch: "B7",
    },
  ],
  value_drafted_kobo: 15000000,
  value_collected_kobo: 13500000,
  value_returned_kobo: 12000000,
  credit_kobo: 12000000,
  credit_applied_kobo: 0,
  credit_on_account_kobo: 0,
  transitions: [{ status: "drafted", at: "2026-11-01T08:00:00Z", by: "rep-1", note: "" }],
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-02T08:00:00Z",
};

test("mapReturn keeps the API's status word, its three quantities and where the expiry came from", () => {
  const r = mapReturn(apiReturn);
  assert.equal(r.status, "inspected", "the API's own word, never a renamed one");
  assert.equal(r.drafted, 150000);
  assert.equal(r.collected, 135000);
  assert.equal(r.returned, 120000);
  assert.equal(r.shop, "Mama Sola Provisions");
  assert.equal(r.lines[0]!.drafted, 10);
  assert.equal(r.lines[0]!.collected, 9);
  assert.equal(r.lines[0]!.returned, 8);
  assert.equal(r.lines[0]!.expirySource, "invoice", "a fact off the invoice is not an estimate");
  assert.equal(personOf(r.steps[0]!.by), "", "an internal id is never shown as a person");
  assert.deepEqual(mapReturns({ returns: [apiReturn], total: 1 }).map((x) => x.id), ["ret_1"]);
  assert.deepEqual(mapReturns({ returns: [], total: 0 }), [], "an empty ledger stays empty");
});

const exposure: ApiExposure = {
  as_of: "2026-11-03T07:00:00Z",
  policy_version: "exp-1",
  buckets: [
    { key: "d1_30", label: "1 to 30 days", from_days: 1, to_days: 30, weight_pct: 125 },
    { key: "d90", label: "Over 90 days", from_days: 91, to_days: 400, weight_pct: 200 },
  ],
  shops: [],
  total: {
    outstanding_kobo: 400000000,
    overdue_kobo: 190000000,
    oldest_days_overdue: 133,
    buckets: { d1_30: 50000000 },
    exposure_kobo: 380000000,
    verified_paid_kobo: 25000000,
    shown_not_counted_kobo: 7000000,
    open_invoices: 61,
    confidence: "high",
    note: "Read from the book.",
  },
};

test("mapExposure reads the API's buckets and invents no figure for a band it did not send", () => {
  const e = mapExposure(exposure);
  assert.equal(e.policyVersion, "exp-1");
  assert.equal(e.bands[1]!.weightPct, 200, "the weight is shown, so the weighted figure is never bare");
  assert.equal(e.total.owed, 4000000);
  assert.equal(e.total.overdue, 1900000);
  assert.equal(e.total.band.d1_30, 500000);
  assert.equal(e.total.band.d90, null, "no figure rather than a made-up nought");
  assert.equal(e.total.weighted, 3800000);
  assert.equal(e.total.verified, 250000);
  assert.equal(e.total.shownNotCounted, 70000);
  assert.equal(e.total.oldest, 133);
});
