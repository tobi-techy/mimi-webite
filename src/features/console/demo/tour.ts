"use client";

import { liveReset } from "@/features/console/api/actions";
import { getLive, notify } from "@/features/console/api/live-store";
import { briefLines, overLimitCard, zohoCard } from "@/features/console/api/mappers";
import { republish } from "@/features/console/api/sync";
import { creditLines } from "@/features/console/content/credit";
import { shops as sampleShops, type Shop } from "@/features/console/content/shops";
import { getDemo, isApiBacked, nextId, setDemo } from "@/features/console/demo/store";
import { TOUR_SLUG, ownTourApproval, resetTourEcho, setTourConversation, tourConversation } from "@/features/console/demo/tour-state";
import type { Conversation, DecisionCard, HelperName, Message, Reply, Speaker } from "@/features/console/demo/types";
import { naira } from "@/features/console/lib/format";
import {
  ORDER_SHOP,
  PAY_SHOP,
  liveBankCredit,
  liveBrief,
  liveDelivery,
  liveLimit,
  liveLimitUndo,
  liveOrderOf,
  liveScreenshot,
  liveShop,
  liveYes,
  liveZoho,
  liveZohoUndo,
  newRun,
  tourLiveOn,
  type LiveOrder,
  type LiveShop,
} from "@/features/console/demo/tour-live";
import { sfx } from "@/lib/sound";

/**
 * The five-scene demo, played in Mimi's chat as one task: the morning brief, a screenshot payment
 * matched (Likely, then Confirmed by bank), the Zoho write (approve, then Undo), an order over its
 * credit limit held with a suggested limit, and a delivery the shop confirms with YES.
 *
 * In the live demo each scene asks the visitor's own copy for the real thing (`tour-live.ts`): the
 * morning brief, the delivery receipt, the screenshot Proof reads as Likely, the bank credit that
 * confirms it, the Zoho approval and its Undo, the new limit and its Undo, the shop's YES. Any step
 * the API can't answer (unreachable, capped, slow) plays from the script below with the same cards
 * (`mappers.ts` builds them from GET /v1/approvals too), so the tour always finishes. Without the
 * API it is all script on the sample shops, and approving and Undo change this tab only. Nothing
 * here moves money: the demo's Zoho is a fake one kept on the demo server.
 */

export { TOUR_SLUG };

type Pick = {
  brief: { name: string; overdue: number; days?: number }[];
  totalOverdue: number;
  lateShops: number;
  pay: { shop: string; amount: number };
  order: { shop: string; owed: number; limit: number; order: number; suggested: number; overdue: number };
};

const round = (n: number, to: number) => Math.max(to, Math.round(n / to) * to);
const ceilTo = (n: number, to: number) => Math.ceil(n / to) * to;
/** "Mama Sola" from "Mama Sola Provisions", "Ade & Kemi" from "Ade & Kemi Ventures". */
const first = (name: string) => {
  const w = name.split(/\s+/);
  return w.slice(0, w[1] === "&" ? 3 : 2).join(" ");
};

/** The figures the tour tells: the visitor's own book in the live demo, else the sample shops. */
function book(): Pick {
  const live = getLive();
  const liveShops = live.status === "ready" && live.shops?.length ? live.shops : null;
  const all: Shop[] = liveShops ?? [...sampleShops];
  const overdueOf = (s: Shop) => (s.live ? s.live.overdue : s.status === "o" ? s.owed : 0);
  const limitOf = (s: Shop) => s.live?.creditLimit || creditLines.find((l) => l.shop.id === s.id)?.limit || round(s.owed * 0.9, 10000);
  const late = all.filter((s) => overdueOf(s) > 0).sort((a, b) => overdueOf(b) - overdueOf(a));
  const brief = late.slice(0, 3).map((s) => ({ name: s.name, overdue: overdueOf(s), days: s.live?.overdueDays || undefined }));
  const payShop = late[0] ?? all[0]!;
  const payAmount = Math.min(500000, round((overdueOf(payShop) || payShop.owed) * 0.4, 10000));
  /* the order: the shop closest to (or past) its limit, not the one that just paid */
  const byUse = all
    .filter((s) => s.id !== payShop.id && limitOf(s) > 0 && s.owed > 0)
    .sort((a, b) => b.owed / limitOf(b) - a.owed / limitOf(a));
  const o = byUse[0] ?? all[1] ?? payShop;
  const limit = limitOf(o);
  const order = round(Math.max(120000, o.owed - limit + limit * 0.15), 10000);
  const suggested = ceilTo((o.owed + order) * 1.1, 50000);
  return {
    brief,
    totalOverdue: late.reduce((n, s) => n + overdueOf(s), 0),
    lateShops: late.length,
    pay: { shop: payShop.name, amount: payAmount },
    order: { shop: o.name, owed: o.owed, limit, order, suggested, overdue: overdueOf(o) },
  };
}

/* ---------- the conversation ---------- */

let epoch = 0;
let picked: Pick | null = null;
/** The live side of this run (null without the API): its shops, the receipt, the API ids behind cards. */
type Live = { prep: Promise<void>; pay?: LiveShop; order?: LiveOrder; delivery?: Promise<string | null>; ids: Map<string, string> };
let live: Live | null = null;
/** A live run already spent this copy's book (the screenshot is paid for): replays start a fresh copy. */
let ranLive = false;
/** The over-limit order went out (the new limit was approved and not undone). */
let released = false;

function base(): Conversation {
  return {
    slug: TOUR_SLUG,
    title: "Your morning with Mimi",
    helper: "Mimi",
    folder: "General",
    code: "TOUR",
    state: "run",
    status: "writing your morning brief",
    working: true,
    ago: "now",
    preview: "Your morning with Mimi",
    messages: [{ id: "tour-d", kind: "date", label: "Today" }],
  };
}

/** Applies a change to the tour conversation and shows it (laid over the API's threads when live). */
function update(fn: (c: Conversation) => Conversation) {
  /* sample build: anything typed into the tour's task lives in the store; start from there */
  const inStore = !isApiBacked() ? getDemo().conversations.find((c) => c.slug === TOUR_SLUG) : undefined;
  const cur = inStore ?? tourConversation() ?? base();
  const next = fn(cur);
  setTourConversation(next);
  if (isApiBacked()) return republish();
  setDemo((s) => {
    const has = s.conversations.some((c) => c.slug === TOUR_SLUG);
    return { ...s, conversations: has ? s.conversations.map((c) => (c.slug === TOUR_SLUG ? next : c)) : [next, ...s.conversations] };
  });
}

type New = Message extends infer M ? (M extends { id: string } ? Omit<M, "id"> : never) : never;

function push(m: New): string {
  const id = nextId("tour");
  update((c) => ({ ...c, ago: "now", messages: [...c.messages, { ...m, id } as Message] }));
  return id;
}

function patch(id: string, fn: (m: Message) => Message) {
  update((c) => ({ ...c, messages: c.messages.map((m) => (m.id === id ? fn(m) : m)) }));
}

const setStatus = (status: string, working: boolean, state: Conversation["state"] = working ? "run" : "idle") =>
  update((c) => ({ ...c, status, working, state }));

const offer = (replies?: Reply[]) => update((c) => ({ ...c, replies }));

const alive = (ep: number) => ep === epoch;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function typing(who: Speaker | null) {
  setDemo((s) => ({ ...s, typing: who && who !== "me" ? { slug: TOUR_SLUG, who: who as HelperName | "Mimi" } : null }));
}

/** A helper "types" for a moment, then her line lands. Returns false when the tour was restarted. */
async function say(who: Exclude<Speaker, "me">, text: string, ep: number, ms = 1100): Promise<boolean> {
  typing(who);
  await sleep(ms);
  if (!alive(ep)) return false;
  typing(null);
  push({ kind: "text", from: who, text, at: Date.now() });
  sfx("console", "ready", { theme: "bubble", emphasis: "subtle" });
  await sleep(350);
  return alive(ep);
}

const next = (label: string, step: string): Reply[] => [{ label, step }];

/* ---------- the five scenes ---------- */

/** Like `say`, with the line worked out while she types (an API answer), or the script's when null. */
async function sayLive(who: Exclude<Speaker, "me">, work: Promise<string | null>, script: () => string, ep: number, ms = 1100): Promise<boolean> {
  typing(who);
  const [text] = await Promise.all([work, sleep(ms)]);
  if (!alive(ep)) return false;
  typing(null);
  push({ kind: "text", from: who, text: text ?? script(), at: Date.now() });
  sfx("console", "ready", { theme: "bubble", emphasis: "subtle" });
  await sleep(350);
  return alive(ep);
}

const TAIL = "Collector has reminders ready, and I'll tell you the moment money lands.";

async function scene1(ep: number) {
  setStatus("writing your morning brief", true);
  const fromApi = live ? liveBrief().then((t) => (t ? `${briefLines(t)}\n\n${TAIL}` : null)) : Promise.resolve(null);
  if (!(await sayLive("Mimi", fromApi, scriptBrief, ep, 1600))) return;
  /* the scene shops come from the visitor's own book: wait for them before naming the next one */
  if (live) await live.prep;
  if (!alive(ep)) return;
  const b = picked!;
  setStatus("watching for payments", false, "idle");
  offer(next(`Next: ${first(b.pay.shop)} sends a payment`, "tour.s2"));
}

function scriptBrief(): string {
  const b = picked!;
  const lines = b.brief.map((s) => `• ${s.name} ${s.days ? `is ${s.days} days overdue on` : "has"} ${naira(s.overdue)}${s.days ? "" : " overdue"}`);
  return [
    "Good morning. Here's your day.",
    "",
    "Top overdue:",
    ...lines,
    "",
    `In all ${naira(b.totalOverdue)} is overdue across ${b.lateShops} shops. ${TAIL}`,
  ].join("\n");
}

async function scene2(ep: number) {
  const b = picked!;
  const lp = live?.pay;
  offer(undefined);
  setStatus("checking a payment", true);
  push({ kind: "event", text: `${b.pay.shop} sent a transfer screenshot on WhatsApp`, at: Date.now() });
  /* live: Proof really reads it (after the delivery that opened its invoice); else the script's figure */
  typing("Proof");
  const [shot] = await Promise.all([lp ? (live!.delivery ?? Promise.resolve(null)).then(() => liveScreenshot(lp)) : Promise.resolve(null), sleep(900)]);
  if (!alive(ep)) return;
  typing(null);
  if (shot) b.pay.amount = shot.amount;
  const amount = b.pay.amount;
  const proof = push({
    kind: "proof",
    from: "Proof",
    at: Date.now(),
    title: "Transfer screenshot",
    meta: `${b.pay.shop} · just now`,
    amount,
    stamp: "Screenshot",
    foot: "Looks real, not in the bank yet",
    footSub: "Matched to their open invoice",
    verdict: "self",
    verdictLabel: "Likely",
  });
  if (!(await say("Proof", `Matched ${naira(amount)} to ${first(b.pay.shop)}'s open invoice. The screenshot looks real, but the bank hasn't shown it yet, so I've marked it Likely, not paid.`, ep, 1300))) return;
  setStatus("waiting for the bank", true);
  const [bank] = await Promise.all([shot && lp ? sleep(1200).then(() => liveBankCredit(lp.id, amount)) : Promise.resolve(null), sleep(2600)]);
  if (!alive(ep)) return;
  patch(proof, (m) =>
    m.kind === "proof" ? { ...m, stamp: "Landed", verdict: "verified", verdictLabel: "Confirmed by bank", foot: "Paid", footSub: "The bank alert matches the screenshot" } : m,
  );
  sfx("console", "success", { emphasis: "subtle" });
  /* two Proof lines, then Mimi: one speaker, so the feed never folds these into a group */
  if (!(await say("Proof", `The bank just confirmed it: ${naira(amount)} from ${b.pay.shop} landed. Now it counts as paid.`, ep, 1200))) return;
  const told = bank?.shopText ?? `We have received your ${naira(amount)} payment. Thank you.`;
  if (!(await say("Mimi", `Collector told ${first(b.pay.shop)}: "${told}"`, ep, 1100))) return;
  await sleep(500);
  if (!alive(ep)) return;
  const card = push({ kind: "card", from: "Mimi", at: Date.now(), card: zohoCard({ shop_name: b.pay.shop, amount_ngn: amount }, "needs") });
  if (bank) {
    live?.ids.set(card, bank.approval.approval_id);
    ownTourApproval(bank.approval.approval_id);
  }
  setStatus("waiting on you", false, "needs");
}

async function scene4(ep: number) {
  const b = picked!;
  const o = b.order;
  offer(undefined);
  setStatus("reading a new order", true);
  if (!(await say("Order", `${o.shop} just ordered ${naira(o.order)} of stock on WhatsApp.`, ep, 1200))) return;
  const after = o.owed + o.order;
  /* live: the same four reasons the API's code writes, from the visitor's own book */
  const reasons = live?.order?.reasons ?? [
    `Owes ${naira(o.owed)} now. This order takes it to ${naira(after)}, ${naira(after - o.limit)} over its ${naira(o.limit)} limit.`,
    o.overdue > 0 ? `${naira(o.overdue)} of what it owes is overdue.` : "Nothing it owes is overdue.",
    `${naira(o.suggested)} covers this order with a little room, so it can go today.`,
  ];
  if (!(await say("Credit", "That would take them over their credit limit, so I've held the order. Your call.", ep, 1200))) return;
  push({
    kind: "card",
    from: "Credit",
    at: Date.now(),
    card: overLimitCard({ shop_name: o.shop, order_ngn: o.order, limit_ngn: o.limit, owed_ngn: o.owed, suggested_limit_ngn: o.suggested, reasons }, "needs"),
  });
  setStatus("waiting on you", false, "needs");
}

async function scene5(ep: number, released: boolean) {
  const b = picked!;
  const lp = live?.pay;
  /* live: the receipt went to the paying shop when the tour began; the YES is theirs */
  const shop = lp ? b.pay.shop : released ? b.order.shop : b.pay.shop;
  offer(undefined);
  setStatus("following a delivery", true);
  const what = lp ? `${shop}'s order this morning` : `${released ? "the order" : "Tuesday's order"} to ${shop}`;
  if (!(await say("Order", `Van 2 delivered ${what}. I sent the receipt on WhatsApp and asked them to reply YES if everything arrived.`, ep, 1500))) return;
  const [yes] = await Promise.all([lp ? liveYes(lp) : Promise.resolve(null), sleep(1400)]);
  if (!alive(ep)) return;
  push({ kind: "event", text: `${shop} replied YES`, at: Date.now() });
  if (!(await say("Order", `${yes ? `They confirmed it, and I told them: "${yes.trim()}"` : "They confirmed it."} The delivery is closed and the receipt is saved, so nobody can argue about it later.`, ep, 1100))) return;
  if (!(await say("Mimi", "That's the morning. Your helpers did the work, and nothing went out or changed in your books without your yes.", ep, 1300))) return;
  update((c) => ({ ...c, state: "done", status: "done", working: false }));
  offer(next("Play it again", "tour.again"));
}

/* ---------- what the owner does ---------- */

/** Starts (or restarts) the tour as the newest task in Mimi's chat. */
export function startTour(): void {
  epoch += 1;
  const ep = epoch;
  /* a replay of a live run: a fresh copy of the book first, so the screenshot has something to pay */
  if (ranLive && tourLiveOn()) {
    ranLive = false;
    void liveReset().then(() => alive(ep) && begin(ep));
    return;
  }
  /* the live demo is still loading the visitor's book: start once it is in (or after 8s) */
  if (getLive().status === "connecting") {
    const t0 = Date.now();
    const wait = () => {
      if (!alive(ep)) return;
      if (getLive().status !== "connecting" || Date.now() - t0 > 8000) return begin(ep);
      window.setTimeout(wait, 200);
    };
    return wait();
  }
  begin(ep);
}

function begin(ep: number) {
  picked = book();
  released = false;
  live = null;
  if (tourLiveOn()) {
    newRun();
    ranLive = true;
    const l: Live = { prep: Promise.resolve(), ids: new Map() };
    l.prep = (async () => {
      const [pay, ord] = await Promise.all([liveShop(PAY_SHOP), liveShop(ORDER_SHOP)]);
      if (!alive(ep) || !picked) return;
      if (pay?.phone) {
        l.pay = pay;
        picked.pay = { shop: pay.name, amount: 34950 };
        /* Van 2's delivery: its receipt opens the invoice the screenshot pays (scene 2), and the shop's YES closes it (scene 5) */
        l.delivery = liveDelivery(pay.id);
      }
      const o = ord ? liveOrderOf(ord) : null;
      if (o) {
        l.order = o;
        picked.order = { shop: o.shop, owed: o.owed, limit: o.limit, order: o.order, suggested: o.suggested, overdue: o.overdue };
      }
    })();
    live = l;
  }
  setTourConversation(null);
  resetTourEcho();
  if (!isApiBacked()) setDemo((s) => ({ ...s, conversations: s.conversations.filter((c) => c.slug !== TOUR_SLUG) }));
  update(() => base());
  setDemo((s) => ({ ...s, active: TOUR_SLUG, playing: false }));
  void scene1(ep);
}

export const tourOn = (): boolean => !!tourConversation() || getDemo().conversations.some((c) => c.slug === TOUR_SLUG);

/** A chip under the tour ("Next: …"). */
export function tourChip(reply: Reply): void {
  const ep = epoch;
  if (!picked) picked = book();
  if (reply.step === "tour.again") return startTour();
  push({ kind: "text", from: "me", at: Date.now(), text: reply.label.replace(/^Next:\s*/, "") });
  offer(undefined);
  if (reply.step === "tour.s2") void scene2(ep);
  else if (reply.step === "tour.s4") void scene4(ep);
  else if (reply.step === "tour.s5") void scene5(ep, released);
}

const cardOf = (id: string): DecisionCard | null => {
  const m = (tourConversation() ?? base()).messages.find((x) => x.id === id);
  return m?.kind === "card" ? m.card : null;
};

const setCard = (id: string, fn: (c: DecisionCard) => DecisionCard) => patch(id, (m) => (m.kind === "card" ? { ...m, card: fn(m.card) } : m));

const clock = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** Approve or decline a tour card. Saving shows for a moment, like an API write. */
export function tourDecide(id: string, approve: boolean): void {
  const c = cardOf(id);
  if (!c || c.status !== "needs") return;
  const ep = epoch;
  const b = picked ?? book();
  sfx("console", "tap");
  if (!approve) {
    setCard(id, (x) => ({ ...x, status: "declined" }));
    const apr = c.kind === "zoho" ? live?.ids.get(id) : undefined;
    if (apr) void liveZoho(apr, false);
    void (async () => {
      if (c.kind === "zoho") {
        if (!(await say("Mimi", "Okay, nothing written to Zoho. The payment still counts as paid here.", ep, 800))) return;
        offer(next(`Next: ${first(b.order.shop)} orders over its limit`, "tour.s4"));
      } else if (c.kind === "limit") {
        released = false;
        if (!(await say("Order", `The limit stays at ${naira(b.order.limit)} and the order stays on hold. I'll ask ${first(b.order.shop)} to pay some of what's owed first.`, ep, 1000))) return;
        offer(next("Next: a delivery gets confirmed", "tour.s5"));
      }
      setStatus("waiting for your next message", false);
    })();
    return;
  }
  setCard(id, (x) => ({ ...x, status: "sending" }));
  setStatus(c.kind === "zoho" ? "writing to Zoho Books" : "saving the new limit", true);
  void (async () => {
    /* live: the API records it in the demo's Zoho, or saves the new limit on the visitor's book */
    const apr = live?.ids.get(id);
    const lo = live?.order;
    const [ok] = await Promise.all([
      c.kind === "zoho" && apr
        ? liveZoho(apr, true)
        : c.kind === "limit" && lo
          ? liveLimit(lo.shopId, lo.suggested).then((change) => (change ? (live?.ids.set(id, change), true) : false))
          : Promise.resolve(true),
      sleep(1100),
    ]);
    if (!alive(ep)) return;
    if (!ok) {
      setCard(id, (x) => ({ ...x, status: "needs" }));
      setStatus("waiting on you", false, "needs");
      notify("info", c.kind === "zoho" ? "Zoho Books didn't answer, so nothing was recorded." : "The new limit didn't save, so nothing changed.");
      return;
    }
    setCard(id, (x) => ({ ...x, status: "sent", sentAt: clock(), undo: { state: "ready" } }));
    sfx("console", "success", { emphasis: "strong" });
    void (async () => {
      if (c.kind === "zoho") {
        if (!(await say("Mimi", `Recorded in Zoho Books against ${first(b.pay.shop)}'s oldest open invoice. If that was a mistake, tap Undo and I'll take it back out.`, ep, 900))) return;
        offer(next(`Next: ${first(b.order.shop)} orders over its limit`, "tour.s4"));
      } else if (c.kind === "limit") {
        released = true;
        if (!(await say("Order", `New limit saved, so the order is released. Van 2 delivers to ${first(b.order.shop)} first thing.`, ep, 900))) return;
        offer(next("Next: a delivery gets confirmed", "tour.s5"));
      }
      setStatus("waiting for your next message", false);
    })();
  })();
}

/** Undo on a tour card: the Zoho record comes out, or the old limit comes back. */
export function tourUndo(id: string): void {
  const c = cardOf(id);
  if (!c || c.undo?.state !== "ready") return;
  const ep = epoch;
  const b = picked ?? book();
  sfx("console", "close", { emphasis: "subtle" });
  setCard(id, (x) => ({ ...x, undo: { state: "busy" } }));
  void (async () => {
    const key = live?.ids.get(id);
    const [ok] = await Promise.all([key ? (c.kind === "zoho" ? liveZohoUndo(key) : liveLimitUndo(key)) : Promise.resolve(true), sleep(900)]);
    if (!alive(ep)) return;
    if (!ok) {
      setCard(id, (x) => ({ ...x, undo: { state: "ready" } }));
      notify("info", "Undo didn't go through, so it is still as you left it.");
      return;
    }
    const text = c.kind === "zoho" ? "Taken back out of Zoho" : `Limit back to ${naira(b.order.limit)}`;
    setCard(id, (x) => ({ ...x, undo: { state: "done", text } }));
    if (c.kind === "limit") released = false;
    const line =
      c.kind === "limit"
        ? say("Order", `Okay, the limit is back to ${naira(b.order.limit)} and the order is on hold again.`, ep, 700)
        : say("Mimi", "Done. Zoho Books is back to how it was. The payment still counts as paid here.", ep, 700);
    if (!(await line)) return;
    /* the next step stays on offer after an Undo (its chip may have gone while she typed) */
    offer(undoNext(c.kind, b));
    setStatus("waiting for your next message", false);
  })();
}

/** The chip that follows a card once it is decided (approved, declined or undone). */
const undoNext = (kind: DecisionCard["kind"], b: Pick): Reply[] | undefined =>
  kind === "zoho" ? next(`Next: ${first(b.order.shop)} orders over its limit`, "tour.s4") : kind === "limit" ? next("Next: a delivery gets confirmed", "tour.s5") : undefined;

export const isTourCard = (slug: string): boolean => slug === TOUR_SLUG;

/** Stops the tour where it is (the owner started typing): it stays in the chat as a finished task. */
export function endTour(): void {
  epoch += 1;
  typing(null);
  if (tourOn()) update((c) => ({ ...c, state: "done", status: "done", working: false, replies: undefined }));
}
