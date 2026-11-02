/**
 * The handoffs contract (MIMI-AGENT docs/HANDOFFS.md, `handoffs-2026-10-30.1`) and the live demo
 * fixes of 30 Oct 2026: naira signs, the demo allowance, handoff lines, cards and chips. Every
 * part must degrade to the plain reply when the API does not send it (the live API today).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { capFromMe, cardBlocks, chipReplies, errorKind, handoffLine, mapThread, mapThreadSummary, nairaSign } from "./mappers.ts";
import type { ApiCard, ApiChip, ApiMe, ApiThreadDetail, ApiThreadSummary } from "./types.ts";

const NOW = Date.UTC(2026, 9, 30, 18, 30);
const AT = "Fri 2026-10-30 7:24 PM WAT (UTC+01:00)";

test("naira: a plain N before a figure becomes ₦, words and ₦ stay as they are", () => {
  assert.equal(nairaSign("Mama Sola Provisions, N2,387,250 overdue"), "Mama Sola Provisions, ₦2,387,250 overdue");
  assert.equal(nairaSign("Total: N7,154,850. (N50k each)"), "Total: ₦7,154,850. (₦50k each)");
  assert.equal(nairaSign("N1,070,050\nN718,650"), "₦1,070,050\n₦718,650");
  assert.equal(nairaSign("No shops, NAFDAC, Nnamdi, SN12, ₦5,000"), "No shops, NAFDAC, Nnamdi, SN12, ₦5,000");
  assert.equal(nairaSign(""), "");
});

const thread: ApiThreadSummary = {
  thread_id: "demo-x:owner",
  kind: "owner",
  shop_id: "",
  shop_name: "",
  last_at: AT,
  last_text: "Total overdue: N7,154,850.",
  last_sender: "mimi",
  messages: 2,
  pending_approvals: 0,
  helper: "mimi",
  helper_name: "Mimi",
  status: "done",
  title: "You and Mimi",
};

test("the sidebar preview and reply bubbles show ₦", () => {
  assert.equal(mapThreadSummary(thread, NOW).preview, "Total overdue: ₦7,154,850.");
});

test("the demo allowance: a 429 is capped, /v1/me shuts the composer before a refused send", () => {
  assert.equal(errorKind(429, "you have used today's demo allowance; it resets at midnight Lagos time"), "capped");
  const me = (d: Partial<NonNullable<ApiMe["demo"]>> | null): ApiMe => ({
    tenant_id: "demo-x",
    role: "owner",
    mode: "demo",
    demo: d === null ? null : { expires_at: null, ip_spent_kobo: 3214, ip_cap_kobo: 10000, global_spent_kobo: 24139, global_cap_kobo: 200000, paused: false, ...d },
  });
  assert.equal(capFromMe(me({})), null);
  assert.equal(capFromMe(me(null)), null);
  assert.equal(capFromMe(null), null);
  const ip = capFromMe(me({ ip_spent_kobo: 10000 }));
  assert.equal(ip?.kind, "capped");
  assert.match(ip!.text, /You've used today's demo budget\. It resets at midnight, Lagos time\./);
  assert.match(capFromMe(me({ global_spent_kobo: 200001 }))!.text, /for everyone/);
  assert.equal(capFromMe(me({ paused: true }))?.kind, "paused");
  for (const t of [ip!.text, capFromMe(me({ paused: true }))!.text]) assert.ok(!t.includes("\u2014"), "no em dashes");
});

const detail = (withContract: boolean): ApiThreadDetail => ({
  thread,
  state: {},
  messages: [
    { message_id: "in:1", direction: "in", sender: "owner", channel: "owner_console", shop_id: "", text: "Who owes me the most?", kind: "text", status: "received", turn_id: "turn_a", simulated: false, at: AT },
    { message_id: "out:1", direction: "out", sender: "mimi", channel: "owner_console", shop_id: "", text: "Mama Sola Provisions owes the most: N3,497,300, 45 days late.", kind: "reply", status: "ready", turn_id: "turn_a", simulated: false, at: AT },
  ],
  steps: withContract
    ? [
        { event_id: "ho_turn_a", turn_id: "turn_a", run_id: "", type: "handoff", step: 0, tool: "", tier: "", short: "Asking Collector", model: "", cost_kobo: 0, duration_ms: 0, at: AT },
        { event_id: "card_turn_a", turn_id: "turn_a", run_id: "", type: "card_read", step: 0, tool: "card:shop_row", tier: "auto", short: "Highest debtor", model: "", cost_kobo: 0, duration_ms: 0, at: AT },
        { event_id: "hor_turn_a", turn_id: "turn_a", run_id: "", type: "handoff_result", step: 0, tool: "", tier: "", short: "Collector: done", model: "", cost_kobo: 0, duration_ms: 0, at: AT },
      ]
    : [],
  turns: [{ turn_id: "turn_a", state: "done", status: "done", helper: "collector", skill: "collector/chase", run_id: "run_a", attempts: 1, simulated: false, created_at: AT, finished_at: AT }],
});

const shopRow: ApiCard = {
  kind: "shop_row",
  title: "Highest debtor",
  skill: "collector/chase",
  shop_row: { shop_id: "shop-001", name: "Mama Sola Provisions", owed_kobo: 349730000, owed_naira: "N3,497,300", overdue_kobo: 238725000, overdue_naira: "N2,387,250", days_late: 45, credit_limit_kobo: 170000000, credit_limit_naira: "N1,700,000", open_invoices: 14 },
  items: [],
  total: 1,
  empty_text: "",
  as_of: "2026-10-28",
  source: "book",
};

const chips: ApiChip[] = [
  { label: "Remind Mama Sola Provisions", tier: "safe", intent: { kind: "turn", text: "Send shop-001 a soft reminder about the overdue balance", assign_to: "collector", target: "" } },
  { label: "Open Mama Sola Provisions", tier: "safe", intent: { kind: "open", text: "", assign_to: "", target: "shop:shop-001" } },
  { label: "Approve it", tier: "approve", intent: { kind: "turn", text: "approve", assign_to: "", target: "" } },
  { label: "Who else owes?", tier: "safe", intent: { kind: "turn", text: "Who else owes me money?", assign_to: "collector", target: "" } },
  { label: "Fourth", tier: "safe", intent: { kind: "turn", text: "x", assign_to: "", target: "" } },
];

test("without the contract (today's live API) the thread is the plain reply, no cards or chips", () => {
  const c = mapThread(detail(false), [], NOW);
  assert.deepEqual(c.messages.map((m) => m.kind), ["date", "text", "text"]);
  const reply = c.messages[2]!;
  assert.ok(reply.kind === "text" && reply.text === "Mama Sola Provisions owes the most: ₦3,497,300, 45 days late." && reply.from === "Collector");
  assert.equal(c.replies, undefined);
  /* extras for a turn the API did not mark: still nothing */
  assert.equal(mapThread(detail(false), [], NOW, [], undefined, new Map()).replies, undefined);
});

test("with the contract: one quiet handoff line, the card joins the reply, chips under it", () => {
  const c = mapThread(detail(true), [], NOW, [], undefined, new Map([["turn_a", { card: shopRow, chips }]]));
  assert.deepEqual(c.messages.map((m) => m.kind), ["date", "text", "step", "answer"]);
  /* round 4: the handoff is a step line naming the helper and the task in the owner's words */
  const ho = c.messages[2]!;
  assert.ok(ho.kind === "step" && ho.variant === "handoff" && ho.to === "Collector" && ho.turn === "turn_a");
  assert.equal(ho.kind === "step" && ho.text, "Handed to Collector: who owes me the most");
  const ans = c.messages[3]!;
  assert.ok(ans.kind === "answer" && ans.from === "Collector");
  assert.equal(ans.blocks[0]?.type, "text");
  const stats = ans.blocks[1];
  assert.ok(stats?.type === "stats");
  assert.deepEqual(stats.items.map((i) => `${i.label} ${i.value}`), ["Owes ₦3,497,300", "Overdue ₦2,387,250", "Days late 45", "Limit ₦1,700,000"]);
  /* safe tier only, at most three, turn asks and page opens */
  assert.deepEqual(c.replies, [
    { label: "Remind Mama Sola Provisions", text: "Send shop-001 a soft reminder about the overdue balance", step: "api", assign: "collector" },
    { label: "Open Mama Sola Provisions", step: "api", open: "shop:shop-001" },
    { label: "Who else owes?", text: "Who else owes me money?", step: "api", assign: "collector" },
  ]);
  /* handoff_result and card_read never show; neither do work steps for them (the handoff line is the one step) */
  assert.equal(c.messages.filter((m) => m.kind === "thought" || (m.kind === "step" && m.variant !== "handoff")).length, 0);
});

test("a handoff to Mimi herself shows no line", () => {
  assert.equal(handoffLine({ type: "handoff", short: "Mimi is answering" }), null);
  assert.equal(handoffLine({ type: "handoff", short: "Brand handed it back; asking Order" }), "Brand handed it back; asking Order");
  assert.equal(handoffLine({ type: "tool", short: "Asking Collector" }), null);
});

test("a list card is a table read from kobo, capped at 8 rows with the full count", () => {
  const items = Array.from({ length: 9 }, (_, i) => ({ item_id: `o${i}`, label: `Shop ${i}: 2 lines`, qty: 7, unit: "units", status: "waiting for you", amount_kobo: 1550000, amount_naira: "N15,500", shop_id: `shop-00${i}` }));
  const blocks = cardBlocks({ kind: "list", title: "Open orders", skill: "order/open-orders", shop_row: null, items, total: 12, total_kobo: 18600000, empty_text: "" });
  const t = blocks[0];
  assert.ok(t?.type === "table");
  assert.deepEqual(t.columns.map((c) => c.label), ["Open orders", "Qty", "Status", "Amount"]);
  assert.equal(t.rows.length, 8);
  assert.deepEqual(t.rows[0], ["Shop 0: 2 lines", "7 units", "waiting for you", { money: 15500 }]);
  assert.equal(t.label, "8 of 12");
  /* an empty list says so; unknown kinds and no card give nothing */
  assert.deepEqual(cardBlocks({ kind: "list", title: "Low stock", skill: "stock/low-stock-report", shop_row: null, items: [], total: 0, empty_text: "Nothing runs out in the next 3 days." }), [
    { type: "text", text: "Nothing runs out in the next 3 days." },
  ]);
  assert.deepEqual(cardBlocks({ kind: "chart", title: "", skill: "", shop_row: null, items: [], total: 0, empty_text: "" }), []);
  assert.deepEqual(cardBlocks(null), []);
  assert.deepEqual(chipReplies(undefined), []);
});
