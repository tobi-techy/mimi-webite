/**
 * Helper inboxes (Tobi, 3 Nov 2026): each helper has her own inbox; a task goes to the helper who
 * owns it and she works it there; Mimi's chat only gets one-line updates from the helpers; a shop's
 * own messages never show in the console.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { borrowedChat, mimiFeed, shopTaskLines, shopUpdates, type ShopTask } from "./chat-view.ts";
import { mapThread, taskLine } from "../api/mappers.ts";
import type { ApiApproval, ApiThreadDetail } from "../api/types.ts";
import type { Message } from "../demo/types.ts";

const AT = "Tue 2026-11-03 10:18 AM WAT (UTC+01:00)";
const AT2 = "Tue 2026-11-03 10:25 AM WAT (UTC+01:00)";
const NOW = Date.UTC(2026, 10, 3, 10, 30);

const owner = {
  thread_id: "demo-1:owner", kind: "owner", shop_id: "", shop_name: "", last_at: AT, last_text: "", last_sender: "mimi",
  messages: 0, pending_approvals: 0, helper: "mimi", helper_name: "Mimi", status: "done", title: "You and Mimi",
};
const shop = {
  ...owner, thread_id: "demo-1:shop:shop-001", kind: "shop", shop_id: "shop-001", shop_name: "Mama Sola Provisions",
  helper: "collector", helper_name: "Collector", title: "Mama Sola Provisions: payment reminder", last_text: "I go pay Friday abeg",
};
const msg = (id: string, dir: "in" | "out", turn: string, text: string, sender = dir === "in" ? "owner" : "mimi", at = AT) => ({
  message_id: id, direction: dir, sender, channel: dir === "in" ? "owner_console" : "owner_console", shop_id: "", text,
  kind: dir === "in" ? "text" : "reply", status: dir === "in" ? "received" : "ready", turn_id: turn, simulated: false, at,
});
const ho = (turn: string, to: string) => ({ event_id: `ho_${turn}`, turn_id: turn, run_id: "", type: "handoff", step: 0, tool: "", tier: "", short: `Asking ${to}`, model: "", cost_kobo: 0, duration_ms: 0, at: AT });
const turnRow = (turn: string, helper: string) => ({ turn_id: turn, state: "done", status: "done", helper, skill: `${helper}/x`, run_id: "", attempts: 1, simulated: false, created_at: AT, finished_at: AT });
const handoff = (turn: string, to: string, via: string) => ({ handoff_id: `ho_${turn}`, contract: "handoffs-2026-10-30.1", from_helper: "mimi", to_helper: to, to_title: to, skill: `${to}/x`, reason: "", via, hop: 0, status: "done" });

/* owner thread: t1 asked in Mimi's chat and routed to Collector; t2 typed straight into Proof's chat; t3 Mimi answers herself */
const ownerDetail: ApiThreadDetail = {
  thread: owner,
  state: {},
  messages: [
    msg("in:1", "in", "t1", "Remind Mama Sola about her balance"),
    msg("out:1", "out", "t1", "Reminder sent to Mama Sola Provisions."),
    msg("in:2", "in", "t2", "Did Ade Stores pay?"),
    msg("out:2", "out", "t2", "Yes: N160,000 matched to the GTB credit."),
    msg("in:3", "in", "t3", "Good morning"),
    msg("out:3", "out", "t3", "Morning! Nothing is waiting on you."),
  ],
  steps: [ho("t1", "Collector"), ho("t2", "Proof")],
  turns: [turnRow("t1", "collector"), turnRow("t2", "proof"), turnRow("t3", "mimi")],
  handoffs: [handoff("t1", "collector", "rule"), handoff("t2", "proof", "assign")],
};

/* a shop thread: Mama Sola wrote on WhatsApp; Collector replied to her and asked the owner to approve a plan */
const shopDetail: ApiThreadDetail = {
  thread: shop,
  state: {},
  messages: [
    { ...msg("in:s1", "in", "s1", "I go pay Friday abeg", "shop", AT2), channel: "shop_whatsapp", shop_id: "shop-001" },
    { ...msg("out:s1", "out", "s1", "Thank you, Mama. Friday it is.", "collector", AT2), channel: "shop_whatsapp", shop_id: "shop-001" },
  ],
  steps: [],
  turns: [turnRow("s1", "collector")],
  handoffs: [],
};
const approval = {
  approval_id: "apr_9", thread_id: shop.thread_id, turn_id: "s1", shop_id: "shop-001", shop_name: "Mama Sola Provisions",
  helper: "collector", tool: "payment_plan", intent_kind: "payment_plan", status: "pending", created_at: AT2,
  summary: "Payment plan: N80,000 on Friday", payload: {}, amount_ngn: 80000,
} as unknown as ApiApproval;

const line = (m: Message) =>
  m.kind === "text" ? `${m.from}: ${m.text}` : m.kind === "step" ? `line: ${m.text}` : m.kind === "system" ? `sys: ${m.text}` : m.kind;
const lines = (list: Message[]) => list.filter((m) => m.kind !== "date").map(line);

const ownerMsgs = () => mapThread(ownerDetail, [], NOW).messages;
const shopConv = (approvals: ApiApproval[] = []) => mapThread(shopDetail, approvals, NOW);
const task = (approvals: ApiApproval[] = []): ShopTask => {
  const c = shopConv(approvals);
  return { slug: c.slug, helper: c.helper, shopName: "Mama Sola Provisions", messages: c.messages };
};

test("Mimi's chat: a handed-over task reads as one update line from the helper, not her work", () => {
  const feed = lines(mimiFeed(ownerMsgs()));
  assert.ok(feed.includes("me: Remind Mama Sola about her balance"));
  assert.ok(feed.includes("line: Collector: Reminder sent to Mama Sola Provisions."));
  assert.ok(!feed.some((l) => l.startsWith("Collector: ")), "Collector's own bubble stays in her inbox");
});

test("Mimi's chat: a task typed in Proof's chat adds one update line; the ask and the work stay with Proof", () => {
  const feed = lines(mimiFeed(ownerMsgs()));
  assert.ok(!feed.includes("me: Did Ade Stores pay?"));
  assert.ok(feed.some((l) => l.startsWith("line: Proof: Yes: ₦160,000 matched")));
  const proof = lines(borrowedChat(ownerMsgs(), "Proof"));
  assert.deepEqual(proof, ["me: Did Ade Stores pay?", "Proof: Yes: ₦160,000 matched to the GTB credit."]);
});

test("Mimi's chat: what Mimi answers herself stays a normal conversation", () => {
  const feed = lines(mimiFeed(ownerMsgs()));
  assert.ok(feed.includes("me: Good morning"));
  assert.ok(feed.includes("Mimi: Morning! Nothing is waiting on you."));
});

test("a shop task: the shop's words never show anywhere; Collector's inbox has the task, her reply line and the card", () => {
  const t = task([approval]);
  const inbox = shopTaskLines(t);
  assert.ok(!JSON.stringify(inbox).includes("I go pay Friday"));
  assert.ok(!JSON.stringify(inbox).includes("Friday it is"), "her words to the shop are the shop's conversation too");
  assert.deepEqual(lines(inbox).slice(0, 2), ["sys: Task from Mama Sola Provisions", "sys: Collector replied to Mama Sola Provisions"]);
  assert.ok(inbox.some((m) => m.kind === "card" && m.card.status === "needs"));
});

test("a shop task: Mimi's chat gets one line, the card waiting on the owner first", () => {
  const ups = lines(shopUpdates([task([approval])]));
  assert.equal(ups.length, 1);
  assert.match(ups[0]!, /^line: Collector: .+, waiting for your approval$/);
  const plain = lines(shopUpdates([task()]));
  assert.deepEqual(plain, ["line: Collector: replied to Mama Sola Provisions"]);
  const feed = lines(mimiFeed(ownerMsgs(), [task()]));
  assert.ok(feed.includes("line: Collector: replied to Mama Sola Provisions"));
  assert.ok(!feed.some((l) => l.includes("I go pay")));
});

test("update lines open the helper's inbox (handoff lines to the helper) and sort by time", () => {
  const feed = mimiFeed(ownerMsgs(), [task()]);
  const ups = feed.filter((m): m is Extract<Message, { kind: "step" }> => m.kind === "step" && /^Collector: replied/.test(m.text));
  assert.equal(ups.length, 1);
  assert.equal(ups[0]!.to, "Collector");
  assert.equal(ups[0]!.variant, "handoff");
  assert.equal(feed.at(-1), ups[0], "the 10:25 shop task lands after the 10:18 owner turns");
});

test("taskLine: one task line per turn, however many messages the shop sends", () => {
  const seen = new Set<string>();
  const a = taskLine({ ...shopDetail.messages[0]! }, "Collector", "Mama Sola Provisions", seen);
  const b = taskLine({ ...shopDetail.messages[0]!, message_id: "in:s1b", text: "abeg" }, "Collector", "Mama Sola Provisions", seen);
  assert.ok(a?.kind === "system" && a.text === "Task from Mama Sola Provisions" && a.turn === "s1");
  assert.equal(b, null);
});
