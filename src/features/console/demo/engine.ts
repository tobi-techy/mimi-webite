"use client";

import { isApiCard, isApiThread, liveDecide, liveReset, liveSend, liveStart, liveUndo } from "@/features/console/api/actions";
import { apiActive, notify } from "@/features/console/api/live-store";
import { consoleMotion } from "@/config/console-motion";
import { sfx } from "@/lib/sound";
import { CHASE_THOUGHT, OWED_LIST, brandCard, idleComputer, owner, photo, planReplies, reminderPlan } from "@/features/console/demo/seed";
import {
  findConversation,
  getDemo,
  nextId,
  patchConversation,
  patchMessage,
  resetDemoState,
  setDemo,
} from "@/features/console/demo/store";
import type {
  ActivityIcon,
  CardRow,
  ComputerState,
  Conversation,
  DecisionCard,
  Doc,
  DocFilter,
  Folder,
  HelperName,
  Message,
  PanelTab,
  PlanItemState,
  StepVariant,
  Worker,
  WorkDetail,
  Reaction,
  ReactableMessage,
  Reply,
  Speaker,
  Step,
  Tone,
} from "@/features/console/demo/types";
import { reactableKinds } from "@/features/console/demo/types";
import { splitReply, typingMs } from "@/features/console/lib/thread-view";
import { runningIn } from "@/features/console/demo/roster";
import { scopeLabel, triggerLabel, type Automation } from "@/features/console/content/automations";
import { consoleRoutes, threadHref } from "@/features/console/config";
import { endTour, isTourCard, startTour, tourChip, tourDecide, tourUndo } from "@/features/console/demo/tour";

/**
 * The demo engine: keyword-matched scripts that make helpers type, answer, build cards, drive the
 * computer panel and file docs. Every timer belongs to the current "epoch"; reset bumps it so
 * nothing from an old run lands in a fresh demo.
 */

type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type NewMessage = DistributiveOmit<Message, "id">;

let epoch = 0;
const alive = (ep: number) => ep === epoch;

/** Waits `ms`; while the computer is paused or under the owner's control, time stops. */
/** The guided demo plays a little slower than live chat, so a recording breathes. */
const STORY_PACE = 1.35;

function wait(ms: number, ep: number, pausable = false): Promise<boolean> {
  return new Promise((resolve) => {
    let left = getDemo().playing ? ms * STORY_PACE : ms;
    const tick = () => {
      if (!alive(ep)) return resolve(false);
      const st = getDemo().computer.status;
      if (!(pausable && (st === "paused" || st === "user"))) left -= 100;
      if (left <= 0) return resolve(true);
      window.setTimeout(tick, 100);
    };
    window.setTimeout(tick, Math.min(100, ms));
  });
}

/** "9:03" (Lagos-style 12-hour clock, no am/pm, like the seeded times). */
export function clock(d = new Date()): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}`;
}
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

/* ---------- message plumbing ---------- */

export function push(slug: string, m: NewMessage): string {
  const id = nextId();
  const mine = "from" in m && m.from === "me";
  patchConversation(slug, (c) => ({
    ...c,
    ago: "now",
    replies: mine ? undefined : c.replies,
    messages: [...c.messages, { ...m, id } as Message],
  }));
  return id;
}


/* ---------- every stage of the work: reasoning, steps, handoffs, gates, the checklist ---------- */

/** Streams a helper's reasoning ("Thinking…"), then folds it into "Thought for Ns". */
async function think(slug: string, from: Worker, text: string, ep: number): Promise<boolean> {
  const words = text.split(" ").length;
  const ms = Math.max(1400, words * 28 + 700) * consoleMotion.pace;
  status(slug, "thinking", true, "run");
  const id = push(slug, { kind: "thought", from, text, at: Date.now(), live: true });
  if (!(await wait(ms, ep))) return false;
  const secs = Math.max(2, Math.round((getDemo().playing ? ms * 1.35 : ms) / 1000) + 1);
  patchMessage(slug, id, (m) => (m.kind === "thought" ? { ...m, live: false, secs } : m));
  return wait(260, ep);
}

type ToolOpts = {
  /** Text once done ("Read the GTBank statement"); the running text is shown until then. */
  done?: string;
  meta?: string;
  detail?: WorkDetail;
  ms?: number;
  variant?: StepVariant;
  /** Ends in the failed state (red) instead of done. */
  fail?: boolean;
};

/** One tool step: spinner while it runs, then a check (or red when it fails), expandable details. */
async function tool(slug: string, from: Worker, icon: ActivityIcon, text: string, ep: number, o: ToolOpts = {}): Promise<boolean> {
  const id = push(slug, { kind: "step", from, variant: o.variant ?? "tool", icon, text, state: "run", at: Date.now() });
  if (!(await wait((o.ms ?? 1100) * consoleMotion.pace, ep))) return false;
  patchMessage(slug, id, (m) =>
    m.kind === "step"
      ? {
          ...m,
          state: o.fail ? "failed" : "done",
          variant: o.fail ? "error" : m.variant,
          text: o.done ?? m.text,
          meta: o.meta,
          detail: o.detail,
          took: `${(((o.ms ?? 1100) * consoleMotion.pace) / 1000).toFixed(1)}s`,
        }
      : m,
  );
  return wait(240, ep);
}

/** A centred grey system event in the thread ("Handed to Credit", "You took control"). */
export function event(slug: string, text: string) {
  push(slug, { kind: "event", text, at: Date.now() });
}

/** "Collector asked Proof to check Ade Stores." */
async function handoff(slug: string, from: Worker, to: HelperName, text: string, ep: number): Promise<boolean> {
  push(slug, { kind: "step", from, variant: "handoff", to, text, state: "done", at: Date.now() });
  event(slug, `Handed to ${to}`);
  return wait(500 * consoleMotion.pace, ep);
}

/** An approval gate tied to a decision card. Mimi proposes, code checks, the owner approves. */
function gate(slug: string, from: Worker, link: string, text = "Waiting on you to approve") {
  push(slug, { kind: "step", from, variant: "gate", icon: "hand", text, state: "wait", link, at: Date.now() });
}

/** Closes the gates waiting on a card once the owner decides. */
function closeGates(slug: string, link: string, approved: boolean) {
  const at = clock();
  patchConversation(slug, (c) => ({
    ...c,
    messages: c.messages.map((m) =>
      m.kind === "step" && m.variant === "gate" && m.link === link && m.state === "wait"
        ? { ...m, state: approved ? "done" : "failed", text: approved ? `You approved · ${at}` : `You declined · ${at}` }
        : m,
    ),
  }));
}

/** Gates the newest pending card in the thread. */
function gateLast(slug: string, from: Worker) {
  const card = pendingCard(slug);
  if (card) gate(slug, from, card.id);
}

function setPlan(slug: string, title: string, labels: string[]) {
  patchConversation(slug, (c) => ({ ...c, plan: { title, items: labels.map((label) => ({ label, state: "todo" as PlanItemState })) } }));
}
/** Moves the checklist: item `i` takes `state`; with `run`/`wait` every earlier open item is ticked. */
function tick(slug: string, i: number, state: PlanItemState) {
  patchConversation(slug, (c) =>
    c.plan
      ? {
          ...c,
          plan: {
            ...c.plan,
            items: c.plan.items.map((it, k) => (k === i ? { ...it, state } : k < i && it.state !== "failed" ? { ...it, state: "done" } : it)),
          },
        }
      : c,
  );
}
/** Ticks the plan item whose label starts with `label` (used by approvals). */
function tickLabel(slug: string, label: string, state: PlanItemState) {
  const i = findConversation(getDemo(), slug)?.plan?.items.findIndex((it) => it.label.startsWith(label)) ?? -1;
  if (i >= 0) tick(slug, i, state);
}

function status(slug: string, text: string, working = true, state?: Conversation["state"]) {
  patchConversation(slug, (c) => ({ ...c, status: text, working, state: state ?? c.state }));
}

function setTyping(slug: string, who: Speaker | null) {
  setDemo((s) => ({ ...s, typing: who ? { slug, who } : null }));
}

/**
 * Typing dots, a natural pause, then the message (live and replayed demo messages only; history
 * renders at once). A long helper reply goes out as 2–3 short consecutive bubbles (Grok Bot style:
 * never a wall of text), each after its own typing dots.
 */
async function say(slug: string, from: Speaker, text: string, ep: number, pause?: number): Promise<boolean> {
  const parts = from === "me" ? [text] : splitReply(text);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    setTyping(slug, from);
    /* dots before every bubble, each one in a run too: 600–1400ms by length (cap 1.6s), 300ms for reduced motion */
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = i === 0 && pause !== undefined ? pause : typingMs(part, consoleMotion.pace, reduced);
    if (!(await wait(ms, ep))) return false;
    setTyping(slug, null);
    push(slug, { kind: "text", from, text: part, at: Date.now() });
  }
  sfx("console", "ready", { theme: "bubble", emphasis: "subtle" });
  return wait(220, ep);
}

async function post(slug: string, from: Speaker, m: NewMessage, ep: number, pause = 900): Promise<boolean> {
  setTyping(slug, from);
  if (!(await wait(pause * consoleMotion.pace, ep))) return false;
  setTyping(slug, null);
  push(slug, m);
  return wait(220, ep);
}

/* ---------- routing ---------- */

export const scriptHelper: Record<"collect" | "proof" | "order" | "credit" | "stock" | "brand", HelperName> = {
  collect: "Collector",
  proof: "Proof",
  order: "Order",
  credit: "Credit",
  stock: "Stock",
  brand: "Brand",
};
type ScriptKey = keyof typeof scriptHelper | "fallback";

function keyOf(text: string): ScriptKey {
  const t = text.toLowerCase();
  if (/(chase|collect|owe|debt|remind|recover)/.test(t)) return "collect";
  if (/(paid|pos|alert|transfer|receipt|verify|fake|gtb|bank)/.test(t)) return "proof";
  if (/(order|carton|deliver|van)/.test(t)) return "order";
  if (/(credit|limit)/.test(t)) return "credit";
  if (/(brand|report|sell-out|sellout|hypo)/.test(t)) return "brand";
  if (/(stock|indomie|warehouse|restock)/.test(t)) return "stock";
  return "fallback";
}

const folderOf: Record<HelperName | "Mimi", Folder> = {
  Collector: "Collections",
  Proof: "Proof",
  Order: "Orders",
  Credit: "Credit",
  Stock: "Stock",
  Brand: "Brands",
  Mimi: "General",
};
const codeOf: Record<HelperName | "Mimi", string> = {
  Collector: "COL",
  Proof: "PRF",
  Order: "ORD",
  Credit: "CRD",
  Stock: "STK",
  Brand: "BRD",
  Mimi: "MIM",
};

const shopNames = ["Chuks & Sons", "Joy Supermarket", "Iya Femi", "Mama Bisi", "Ade Stores", "Bright Star", "Kola Mart", "Ola & Daughters"];
function shopIn(text: string, fallback: string): string {
  const t = text.toLowerCase();
  return shopNames.find((s) => t.includes(s.toLowerCase().split(" ")[0] ?? "")) ?? fallback;
}

/** The newest card in a thread still waiting on the owner. */
function pendingCard(slug: string, kind?: DecisionCard["kind"]): Extract<Message, { kind: "card" }> | undefined {
  const c = findConversation(getDemo(), slug);
  return [...(c?.messages ?? [])]
    .reverse()
    .find((m): m is Extract<Message, { kind: "card" }> => m.kind === "card" && m.card.status === "needs" && (!kind || m.card.kind === kind));
}

const joyChecked = (slug: string) => !pendingCard(slug, "plan")?.card.rows.some((r) => r.label === "Joy Supermarket");

/**
 * Free typing: which scripted step a typed message runs. Chips are the primary path; this keeps
 * typing working (a typed chip label runs that chip, then keywords, then a helpful fallback).
 */
function stepFor(slug: string, text: string): string {
  const t = text.toLowerCase().trim();
  const c = findConversation(getDemo(), slug);
  const chip = c?.replies?.find((r) => t === r.label.toLowerCase() || t === (r.text ?? "").toLowerCase());
  if (chip) return chip.step;
  if (/\b(approve|go ahead|confirm)\b|^(yes|ok|okay|send it)\b/.test(t) && pendingCard(slug)) return "gen.approve";
  const key = keyOf(t);
  if (key === "proof") {
    if (pendingCard(slug, "plan") && !joyChecked(slug)) return "col.joy";
    return /(kola|fake)/.test(t) ? "prf.recheck" : "prf.check";
  }
  const map: Record<ScriptKey, string> = {
    collect: "col.start",
    proof: "prf.check",
    order: "ord.new",
    credit: "crd.new",
    stock: "stk.draft",
    brand: "brd.new",
    fallback: "gen.fallback",
  };
  return map[key];
}

/* ---------- chips ---------- */

/** Offer reply chips under the newest helper message (or clear them). */
export function offer(slug: string, replies?: Reply[]) {
  patchConversation(slug, (c) => ({ ...c, replies: replies?.length ? replies : undefined }));
}

function sleep(ms: number, ep: number): Promise<boolean> {
  return new Promise((r) => window.setTimeout(() => r(alive(ep)), ms));
}

const CHIP_CHAR_MS = 25;
let chipBusy = false;

/**
 * A chip tap: "types" the reply into the composer (25ms a character, so it looks like typing on
 * camera), sends it, then runs the chip's scripted step. The only sound is the tap.
 */
export async function tapChip(slug: string, reply: Reply): Promise<void> {
  if (isTourCard(slug)) return tourChip(reply);
  if (chipBusy || getDemo().typing?.slug === slug) return;
  chipBusy = true;
  const ep = epoch;
  sfx("console", "tap");
  offer(slug, undefined);
  const text = reply.text ?? reply.label;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    for (let i = 1; i <= text.length; i++) {
      setDemo((s) => ({ ...s, draft: { slug, text: text.slice(0, i) } }));
      if (!(await sleep(CHIP_CHAR_MS, ep))) {
        chipBusy = false;
        return;
      }
    }
    if (!(await sleep(260, ep))) {
      chipBusy = false;
      return;
    }
  }
  setDemo((s) => ({ ...s, draft: null }));
  const mid = push(slug, { kind: "text", from: "me", text, at: Date.now(), read: true });
  chipBusy = false;
  helperReacts(slug, mid, text, ep);
  void runStep(slug, reply.step, text, ep);
}

/* ---------- public actions ---------- */

/** The owner types and sends a message in a thread; the right helper answers. */
export function sendMessage(slug: string, text: string, opts: { assign?: string; to?: Worker } = {}) {
  /* live demo: typing during the tour ends it and talks to the real Mimi on the owner thread */
  if (isTourCard(slug) && apiActive()) {
    const owner = getDemo().conversations.find((c) => c.api && c.helper === "Mimi" && c.slug !== slug);
    endTour();
    if (owner) return sendMessage(owner.slug, text, opts);
  }
  if (isApiThread(slug)) {
    sfx("console", "tap");
    return void liveSend(slug, text, opts);
  }
  const clean = text.trim();
  if (!clean) return;
  const step = stepFor(slug, clean);
  const mid = push(slug, { kind: "text", from: "me", text: clean, at: Date.now() });
  sfx("console", "tap");
  helperReacts(slug, mid, clean, epoch);
  void runStep(slug, step, clean, epoch);
}

/**
 * The owner writes while the helper is mid-run: the bubble lands now tagged "Queued, after current
 * task", and the helper picks it up as soon as the current step ends (RAI-283). "Interrupt now" in the
 * bubble's menu (interruptQueued) lets her take it straight away.
 */
export function steerMessage(slug: string, text: string, opts: { assign?: string; to?: Worker } = {}) {
  if (isApiThread(slug)) {
    sfx("console", "tap");
    return void liveSend(slug, text, opts);
  }
  const clean = text.trim();
  if (!clean) return;
  const c = findConversation(getDemo(), slug);
  if (!c) return;
  const mid = push(slug, { kind: "text", from: "me", text: clean, at: Date.now(), queued: true });
  sfx("console", "tap");
  const ep = epoch;
  const started = Date.now();
  const poll = () => {
    if (!alive(ep)) return;
    const s = getDemo();
    const now = findConversation(s, slug);
    const mine = now?.messages.find((x) => x.id === mid);
    // interrupted (or taken elsewhere): interruptQueued already ran it
    if (!mine || (mine.kind === "text" && !mine.queued)) return;
    if (now && runningIn(s, now) && Date.now() - started < 30000) {
      window.setTimeout(poll, 400);
      return;
    }
    unqueue(slug, mid);
    event(slug, `Steered by you · ${c.helper} took it at the next step`);
    void runStep(slug, stepFor(slug, clean), clean, ep);
  };
  window.setTimeout(poll, 400);
}

function unqueue(slug: string, id: string) {
  patchConversation(slug, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === id && m.kind === "text" ? { ...m, queued: undefined } : m)),
  }));
}

/** Ends whatever the helper is doing in this thread: live reasoning and running steps stop as "Paused by you". */
export function pauseRun(slug: string) {
  if (isApiThread(slug)) return void notify("info", "Pausing a live run from the console is not wired to Mimi yet.");
  epoch += 1;
  chipBusy = false;
  setDemo((s) => ({ ...s, playing: false, typing: s.typing?.slug === slug ? null : s.typing, draft: null }));
  patchConversation(slug, (c) => ({
    ...c,
    status: "Paused by you",
    working: false,
    state: c.state === "run" ? "idle" : c.state,
    messages: c.messages.map((m) =>
      m.kind === "thought" && m.live ? { ...m, live: false } : m.kind === "step" && m.state === "run" ? { ...m, state: "done", text: `${m.text} · paused` } : m,
    ),
  }));
  event(slug, "Paused by you");
}

/** "Interrupt now" on a queued bubble: the helper stops the current task and takes this message. */
export function interruptQueued(slug: string, id: string) {
  const c = findConversation(getDemo(), slug);
  const m = c?.messages.find((x) => x.id === id);
  if (!c || !m || m.kind !== "text" || !m.queued) return;
  pauseRun(slug);
  unqueue(slug, id);
  event(slug, `Interrupted by you · ${c.helper} took your message now`);
  void runStep(slug, stepFor(slug, m.text), m.text, epoch);
}

/** Home composer: a new thread with the helper the words point at. Returns its slug. */
export function startThread(text: string, pick?: HelperName | "Mimi"): string {
  if (apiActive()) {
    sfx("console", "tap");
    return liveStart(text);
  }
  const clean = text.trim();
  const key = keyOf(clean);
  const helper: HelperName | "Mimi" = pick && pick !== "Mimi" ? pick : key === "fallback" ? "Mimi" : scriptHelper[key];
  const n = getDemo().counter + 1;
  const slug = `new-${n}`;
  const title = clean.length > 52 ? `${clean.slice(0, 50).trimEnd()}…` : clean;
  const conv: Conversation = {
    slug,
    title,
    helper,
    folder: folderOf[helper],
    code: `${codeOf[helper]}-${20 + (n % 80)}`,
    state: "run",
    status: "reading your message",
    working: true,
    ago: "now",
    created: true,
    preview: title,
    messages: [{ id: `d${n}`, kind: "date", label: `Today ${clock()}` }],
  };
  setDemo((s) => ({ ...s, counter: n, conversations: [conv, ...s.conversations] }));
  const step = stepFor(slug, clean);
  push(slug, { kind: "text", from: "me", text: clean, at: Date.now() });
  sfx("console", "tap");
  const ep = epoch;
  window.setTimeout(() => void runStep(slug, step, clean, ep), 350);
  return slug;
}

export const conversationHref = (c: Pick<Conversation, "slug" | "created">) =>
  c.created ? `${consoleRoutes.threads}/new?id=${c.slug}` : threadHref(c.slug);

/* ---------- scripted steps (every chip leads to one) ---------- */

async function runStep(slug: string, step: string, text: string, ep: number) {
  const c = findConversation(getDemo(), slug);
  if (!c) return;
  status(slug, "typing", true, "run");
  const helper = c.helper;
  switch (step) {
    /* collections story */
    case "col.start":
      return collect(slug, ep);
    case "col.joy":
      return joyCheck(slug, ep);
    case "col.review":
      return reviewPlan(slug, ep);
    case "col.soft":
      return softChuks(slug, ep);
    case "col.kola":
      if (!(await say(slug, "Proof", "Kola Mart's alert said ₦120,000 landed at 16:05 yesterday. GTB shows nothing, so it's fake. They stay on Firm and their next order is on hold.", ep))) return;
      waiting(slug);
      return offer(slug, planReplies(true).filter((r) => r.step !== "col.kola"));
    case "col.approve":
      return approvePending(slug, "plan", ep);
    case "col.after":
      if (!(await post(slug, "Proof", brightProof(), ep, 1100))) return;
      sfx("console", "success", { emphasis: "subtle" });
      await say(slug, "Collector", "Bright Star paid ₦58,000 after the reminder. Verified. 3 shops left, I'll keep watching.", ep);
      return status(slug, "watching GTB alerts", true, "run");
    case "col.chuksnow":
      if (!(await say(slug, "Collector", "Sent Mr Chuks a polite reminder now: ₦62,400, 9 days late. I'll check GTB again at 4pm.", ep))) return;
      return status(slug, "checking GTB at 4pm", false, "idle");

    /* order */
    case "ord.new":
      await order(slug, text, ep);
      return offer(slug, orderReplies(slug));
    case "ord.confirm":
      return approvePending(slug, "order", ep);
    case "ord.thirty":
      return thirty(slug, ep);
    case "ord.why":
      if (!(await say(slug, "Order", "She stocks up before month-end salaries. She did the same in September and paid in 2 days.", ep))) return;
      waiting(slug);
      return offer(slug, orderReplies(slug).filter((r) => r.step !== "ord.why"));
    case "ord.note":
      if (!(await say(slug, "Order", "Added for the driver: call Mama Bisi 10 minutes before you arrive.", ep))) return;
      return status(slug, "on Saturday's route", false, "done");

    /* credit */
    case "crd.new":
      await credit(slug, text, ep);
      return offer(slug, creditReplies(slug));
    case "crd.approve":
      return approvePending(slug, "credit", ep);
    case "crd.125":
      return smallerLimit(slug, ep);
    case "crd.why":
      if (!(await say(slug, "Credit", "Her last 8 invoices were paid in 1, 2, 3, 2, 1, 3, 2 and 2 days. Average invoice ₦84,000.", ep))) return;
      waiting(slug);
      return offer(slug, creditReplies(slug).filter((r) => r.step !== "crd.why"));

    /* stock */
    case "stk.draft":
      await stock(slug, ep);
      return offer(slug, [
        { label: "Approve restock", step: "stk.approve" },
        { label: "Order 80 instead", text: "Order 80 cartons instead", step: "stk.80" },
      ]);
    case "stk.which":
      if (!(await say(slug, "Stock", "Mama Bisi, Joy Supermarket, Bright Star, Chuks & Sons, Ola & Daughters and Ade Stores have less than a week left.", ep))) return;
      status(slug, "watching Indomie", false, "run");
      return offer(slug, [{ label: "Draft a restock", text: "Draft a restock from Dufil", step: "stk.draft" }]);
    case "stk.approve":
      return approvePending(slug, "stock", ep);
    case "stk.80":
      return smallerRestock(slug, ep);

    /* brand */
    case "brd.new":
      await brand(slug, text, ep);
      return offer(slug, brandReplies(slug));
    case "brd.send":
      return approvePending(slug, "brand", ep);
    case "brd.note":
      return brandNote(slug, ep);
    case "brd.open": {
      const doc = reportDoc(slug);
      if (doc) openDoc(doc);
      if (!(await say(slug, "Brand", "It's open in Docs. Edit anything before it goes to the brand.", ep))) return;
      waiting(slug);
      return offer(slug, brandReplies(slug).filter((r) => r.step !== "brd.open"));
    }

    /* proof */
    case "prf.check":
      await proofCheck(slug, ep, "verified");
      return;
    case "prf.recheck":
      await proofCheck(slug, ep, "fake");
      if (!alive(ep)) return;
      if (pendingCard(slug, "flag")) {
        waiting(slug);
        return offer(slug, [
          { label: "Hold their orders", step: "prf.hold" },
          { label: "Draft a message to Kola Mart", step: "prf.msg" },
        ]);
      }
      return;
    case "prf.hold":
      return approvePending(slug, "flag", ep);
    case "prf.msg":
      if (!(await say(slug, "Proof", "Draft for Kola Mart: “Good afternoon. The ₦120,000 from your 16:05 alert hasn't reached us. Please check with your bank. Your next order goes out once it lands.” Nothing sent yet.", ep, 1500))) return;
      if (pendingCard(slug, "flag")) {
        waiting(slug);
        return offer(slug, [{ label: "Hold their orders", step: "prf.hold" }]);
      }
      return status(slug, "draft ready", false, "done");

    /* migrated threads */
    case "osh.bigger": {
      if (!(await say(slug, "Collector", "Asked Blessing for ₦120,000 today and the rest over 3 weeks. They agreed, so I updated the plan.", ep))) return;
      const m = pendingCard(slug);
      if (m)
        patchMessage(slug, m.id, (x) =>
          x.kind === "card"
            ? { ...x, card: { ...x.card, sub: "₦312,750 · ₦120,000 now", rows: [{ label: "Today", amount: 120000 }, { label: "Weeks 2 to 4", amount: 192750, note: "₦64,250 a week" }, ...x.card.rows.slice(2)] } }
            : x,
        );
      waiting(slug);
      return offer(slug, [{ label: "Approve the plan", step: "gen.approve" }]);
    }
    case "arc.fakes":
      if (!(await say(slug, "Proof", "Kola Mart and Sunny Provisions. Both sent screenshots of transfers that never landed.", ep))) return;
      return status(slug, "2 fake alerts flagged", false, "done");

    /* structured answers (seed-answers.ts) */
    case "ans.ikeja.monday":
      if (!(await say(slug, "Collector", "Done. Ifeoma Enterprises and Joy Provisions are first on Monday's Van 3 run, and I'll send each a WhatsApp reminder on Sunday at 6pm.", ep))) return;
      status(slug, "Monday run updated", false, "done");
      return offer(slug, [{ label: "Open the collections list", step: "ans.ikeja.open" }]);
    case "ans.ikeja.open":
      openDoc("doc-col-oct19");
      if (!(await say(slug, "Collector", "It's open in Docs. The four shops at the top are the ones Van 3 missed.", ep))) return;
      return status(slug, "answered", false, "done");
    case "ans.risk.hold":
      if (!(await say(slug, "Credit", "Joy Provisions' next order is on hold until the ₦259,000 lands. I told Order, and I'll tell you the moment she pays.", ep))) return;
      status(slug, "Joy on hold", false, "done");
      return offer(slug, [{ label: "Draft a plan for Ade & Kemi", text: "Draft a payment plan for Ade & Kemi", step: "ans.risk.plan" }]);
    case "ans.risk.plan":
      openDoc("doc-plan-ade");
      if (!(await say(slug, "Credit", "Drafted: ₦120,000 this Friday, then ₦72,300 a week for 3 weeks. It's open in Docs. Nothing goes to them until you say so.", ep))) return;
      return status(slug, "plan drafted", false, "done");

    /* generic */
    case "gen.approve":
      return approvePending(slug, undefined, ep);
    case "gen.update": {
      const who: Speaker = helper;
      if (!(await say(slug, who, `Still on it. ${c.preview.replace(/\.$/, "")}. I'll tell you the moment anything needs you.`, ep))) return;
      return status(slug, c.status, c.working, c.state === "needs" ? "needs" : "run");
    }
    default:
      return fallback(slug, helper, ep);
  }
}

function waiting(slug: string) {
  status(slug, "waiting on you", false, "needs");
}

const orderReplies = (slug: string): Reply[] => {
  const m = pendingCard(slug, "order");
  const cartons = Number(/\((\d+)\)/.exec(m?.card.rows[0]?.label ?? "")?.[1] ?? 40);
  return [
    { label: `Confirm ${cartons} cartons`, step: "ord.confirm" },
    ...(cartons !== 30 ? [{ label: "Make it 30", text: "Make it 30 cartons instead", step: "ord.thirty" }] : []),
    { label: "Why so many?", text: "Why is she ordering so many?", step: "ord.why" },
  ];
};

const creditReplies = (slug: string): Reply[] => {
  const m = pendingCard(slug, "credit");
  const to = /→ (₦[\d,]+)/.exec(m?.card.sub ?? "")?.[1] ?? "₦150,000";
  return [
    { label: `Approve ${to}`, step: "crd.approve" },
    ...(to !== "₦125,000" ? [{ label: "Make it ₦125,000", step: "crd.125" }] : []),
    { label: "Show her payments", step: "crd.why" },
  ];
};

const brandReplies = (slug: string): Reply[] => {
  const name = /Send to (\w+)/.exec(pendingCard(slug, "brand")?.card.title ?? "")?.[1] ?? "Hypo";
  return [
    { label: `Send it to ${name}`, step: "brd.send" },
    { label: "Add a note on Idumota", text: "Add a note that Idumota grew because of the new van route", step: "brd.note" },
    { label: "Open the report", step: "brd.open" },
  ];
};

const reportDoc = (slug: string) =>
  getDemo().docs.find((d) => d.thread === slug && d.body.type === "report")?.id ??
  (findConversation(getDemo(), slug)?.messages.find((m) => m.kind === "doc") as Extract<Message, { kind: "doc" }> | undefined)?.docId;

export const CHASE_PLAN = [
  "Check the bank for payments",
  "Read the shop book",
  "Ask Proof to verify alerts",
  "Draft the reminders",
  "Get your approval",
  "Send on WhatsApp",
];

/** The chase story, with every stage on screen: think, read, match, hand off, retry, draft, gate. */
async function collect(slug: string, ep: number) {
  setPlan(slug, "Chase everyone over ₦50k", CHASE_PLAN);
  tick(slug, 0, "run");
  if (!(await think(slug, "Collector", CHASE_THOUGHT, ep))) return;
  if (!(await say(slug, "Collector", "On it. Checking the bank first so we don't chase anyone who already paid.", ep, 700))) return;
  status(slug, "checking the bank");
  if (
    !(await tool(slug, "Collector", "search", "Reading the GTBank statement", ep, {
      done: "Read the GTBank statement",
      meta: "· 38 credits since Monday",
      detail: { type: "kv", rows: [["Account", "Coral Lane Trading Ltd · ****4471"], ["Range", "19 to 23 Oct"], ["Credits", "38 · ₦2,914,500"]] },
      ms: 1300,
    }))
  )
    return;
  if (
    !(await tool(slug, "Collector", "receipt", "Matching credit alerts to shops", ep, {
      done: "Matched **1** credit alert",
      detail: { type: "table", head: ["Time", "Narration", "Credit"], rows: [["08:42", "TRF/ADE STORES/INV-2207", "₦45,000"]] },
    }))
  )
    return;
  tick(slug, 1, "run");
  status(slug, "reading the shop book");
  if (
    !(await tool(slug, "Collector", "folder", "Exploring sources", ep, {
      variant: "group",
      done: "Explored 3 sources",
      detail: {
        type: "list",
        items: [
          { icon: "landmark", text: "GTBank statement", meta: "38 credits" },
          { icon: "book-text", text: "Shop book", meta: "48 shops · 9 owe over ₦50k" },
          { icon: "message-square", text: "WhatsApp chats", meta: "6 replies this week" },
        ],
      },
    }))
  )
    return;
  if (
    !(await tool(slug, "Collector", "book-text", "Opening the shop book", ep, {
      done: "Opened shop book · Chuks & Sons",
      detail: { type: "kv", rows: [["Owes", "₦62,400"], ["Days late", "9"], ["Last paid", "14 Oct · ₦30,000"], ["Promise", "None on file"]] },
      ms: 900,
    }))
  )
    return;
  tick(slug, 2, "run");
  if (!(await handoff(slug, "Collector", "Proof", "Collector asked **Proof** to check Ade Stores", ep))) return;
  status(slug, "Proof is checking Ade Stores");
  if (
    !(await tool(slug, "Proof", "landmark", "Fetching the alert from GTBank", ep, {
      done: "GTBank timed out",
      meta: "· after 8.0s",
      fail: true,
      ms: 1300,
      detail: { type: "code", label: "Error", text: "GET ibank.gtbank.com/statement?ref=TRF-0842\n504 Gateway Timeout after 8.0s" },
    }))
  )
    return;
  if (!(await tool(slug, "Proof", "refresh-cw", "Retrying", ep, { variant: "retry", done: "Retried · alert loaded", meta: "· 1.2s", ms: 1000 }))) return;
  if (!(await post(slug, "Proof", adeProof(), ep, 900))) return;
  sfx("console", "success", { emphasis: "subtle" });
  if (!(await say(slug, "Proof", "Ade Stores already paid. Took them off the list.", ep))) return;
  if (getDemo().playing) {
    const last = findConversation(getDemo(), slug)?.messages.at(-1);
    if (!(await wait(600, ep))) return;
    if (last) react(slug, last.id, "heart");
  }
  tick(slug, 3, "run");
  if (
    !(await think(
      slug,
      "Collector",
      "5 shops left over ₦50,000. Chuks & Sons is 9 days late, so **Firm**. Joy says POS, so **Soft** until Proof sees it land. Kola Mart's alert looks off: keep Firm and flag it.",
      ep,
    ))
  )
    return;
  status(slug, "writing the plan");
  if (
    !(await tool(slug, "Collector", "pen", "Drafting 5 reminders", ep, {
      done: "Drafted 5 reminders",
      detail: {
        type: "table",
        head: ["Shop", "Owes", "Tone"],
        rows: [
          ["Chuks & Sons", "₦62,400", "Firm"],
          ["Joy Supermarket", "₦91,000", "Soft"],
          ["Bright Star", "₦58,000", "Soft"],
          ["Ola & Daughters", "₦54,500", "Soft"],
          ["Kola Mart", "₦120,000", "Firm"],
        ],
      },
      ms: 1400,
    }))
  )
    return;
  if (!(await say(slug, "Collector", OWED_LIST, ep))) return;
  await planCard(slug, reminderPlan(), ep);
  if (!alive(ep)) return;
  if (!(await say(slug, "Collector", "Here's the plan. Nothing goes out until you approve.", ep, 700))) return;
  const card = pendingCard(slug, "plan");
  tick(slug, 4, "wait");
  if (card) gate(slug, "Collector", card.id);
  waiting(slug);
  offer(slug, planReplies(false));
}

async function joyCheck(slug: string, ep: number) {
  const c = findConversation(getDemo(), slug);
  if (c?.plan) tickLabel(slug, "Ask Proof", "run");
  if (!(await handoff(slug, "Collector", "Proof", "Collector asked **Proof** to check Joy's POS payment", ep))) return;
  if (
    !(await think(
      slug,
      "Proof",
      "Joy says ₦91,000 went by POS. POS money lands in batches, so it can show up hours later. Check the slip, then look for the settlement on GTBank. Until it lands it stays **self-reported**.",
      ep,
    ))
  )
    return;
  if (!c?.messages.some((m) => m.kind === "photos")) {
    status(slug, "checking Joy's POS payment");
    if (!(await post(slug, "Proof", { kind: "photos", from: "Proof", at: Date.now(), label: "3 Photos · Joy Supermarket", photos: [photo.shelf, photo.shop, photo.counter] }, ep, 1100))) return;
    const fan = findConversation(getDemo(), slug)?.messages.at(-1);
    if (getDemo().playing && fan?.kind === "photos") {
      if (!(await wait(500, ep))) return;
      toggleFan(slug, fan.id);
    }
    if (!(await say(slug, "Proof", "Joy sent photos of the POS slip. Self-reported until it lands in GTB.", ep))) return;
  }
  await proofCheck(slug, ep, "both");
  if (!alive(ep)) return;
  const plan = pendingCard(slug, "plan");
  if (plan) {
    const live = plan.card.rows.filter((r) => r.tone !== "Skip");
    if (!(await say(slug, "Collector", `Updated the plan: ${live.length} shops, ${naira(liveTotal(plan.card.rows))}. Kola Mart stays on Firm.`, ep))) return;
    waiting(slug);
    offer(slug, planReplies(true));
  }
}

async function reviewPlan(slug: string, ep: number) {
  const plan = pendingCard(slug, "plan");
  if (!plan) {
    await say(slug, "Collector", "There's no plan waiting here. Ask me to chase anyone and I'll build one.", ep);
    return status(slug, "waiting for your next message", false, "idle");
  }
  openSheet(slug, plan.id);
  if (!(await say(slug, "Collector", "Here it is. Change any shop's tone, then approve.", ep, 700))) return;
  waiting(slug);
  offer(slug, planReplies(joyChecked(slug)).filter((r) => r.step !== "col.review"));
}

async function softChuks(slug: string, ep: number) {
  const plan = pendingCard(slug, "plan");
  const row = plan?.card.rows.findIndex((r) => r.label === "Chuks & Sons") ?? -1;
  if (plan && row >= 0) setRowTone(slug, plan.id, row, "Soft");
  if (!(await say(slug, "Collector", "Done. Chuks & Sons is on Soft now. Nothing sent yet.", ep))) return;
  waiting(slug);
  offer(slug, planReplies(joyChecked(slug)).filter((r) => r.step !== "col.soft"));
}

async function thirty(slug: string, ep: number) {
  const old = pendingCard(slug, "order");
  const shop = old?.card.shop ?? "Mama Bisi Provisions";
  if (old) {
    patchMessage(slug, old.id, (x) => (x.kind === "card" ? { ...x, card: { ...x.card, status: "declined" } } : x));
    patchConversation(slug, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.kind === "step" && m.variant === "gate" && m.link === old.id && m.state === "wait" ? { ...m, state: "done", text: "Replaced by the 30-carton order" } : m)),
    }));
  }
  if (!(await post(slug, "Order", { kind: "card", from: "Order", at: Date.now(), card: orderCard(shop, 30) }, ep, 1000))) return;
  sfx("console", "attention");
  gateLast(slug, "Order");
  if (!(await say(slug, "Order", "Done. 30 cartons, ₦96,000, still Saturday.", ep))) return;
  waiting(slug);
  offer(slug, orderReplies(slug).filter((r) => r.step !== "ord.why"));
}

async function smallerLimit(slug: string, ep: number) {
  const m = pendingCard(slug, "credit");
  if (m)
    patchMessage(slug, m.id, (x) =>
      x.kind === "card"
        ? { ...x, card: { ...x.card, amount: 125000, sub: x.card.sub.replace(/→ ₦[\d,]+/, "→ ₦125,000"), doneText: "Limit raised to ₦125,000" } }
        : x,
    );
  if (!(await say(slug, "Credit", "Changed it to ₦125,000. Approve when you're ready.", ep))) return;
  waiting(slug);
  offer(slug, creditReplies(slug));
}

async function smallerRestock(slug: string, ep: number) {
  const m = pendingCard(slug, "stock");
  if (m)
    patchMessage(slug, m.id, (x) =>
      x.kind === "card"
        ? {
            ...x,
            card: {
              ...x.card,
              amount: 256000,
              sub: "80 cartons · ₦256,000",
              rows: x.card.rows.map((r) => (r.amount !== undefined ? { ...r, amount: 256000 } : r)),
            },
          }
        : x,
    );
  if (!(await say(slug, "Stock", "Changed to 80 cartons, ₦256,000. That lasts until next Wednesday.", ep))) return;
  waiting(slug);
  offer(slug, [{ label: "Approve restock", step: "stk.approve" }]);
}

async function brandNote(slug: string, ep: number) {
  const doc = reportDoc(slug);
  if (doc) {
    editDocNote(doc, "Idumota grew 11% after the new van route.");
    openDoc(doc);
  }
  if (!(await say(slug, "Brand", "Added your note to the report. The new version is in Docs.", ep))) return;
  waiting(slug);
  offer(slug, brandReplies(slug).filter((r) => r.step !== "brd.note"));
}

async function planCard(slug: string, card: DecisionCard, ep: number) {
  status(slug, "writing the plan");
  if (!(await post(slug, "Collector", { kind: "card", from: "Collector", at: Date.now(), card }, ep, 1200))) return;
  sfx("console", "attention");
  waiting(slug);
  fileDoc({
    title: card.title,
    kind: "MD",
    by: "Collector",
    thread: slug,
    body: { type: "plan", rows: card.rows, total: liveTotal(card.rows) },
    note: "Polite, but firm past a week.",
  });
}

const adeProof = (): NewMessage => ({
  kind: "proof",
  from: "Proof",
  at: Date.now(),
  title: "GTBank credit alert",
  meta: "Ade Stores · 08:42",
  amount: 45000,
  stamp: "Landed",
  foot: "Ade Stores already paid",
  footSub: "Matched to your GTB account",
  verdict: "verified",
});
const brightProof = (): NewMessage => ({
  kind: "proof",
  from: "Proof",
  at: Date.now(),
  title: "GTBank credit alert",
  meta: `Bright Star · ${clock()}`,
  amount: 58000,
  stamp: "Landed",
  foot: "Bright Star paid",
  footSub: "Matched to your GTB account",
  verdict: "verified",
});

function orderCard(shop: string, cartons: number): DecisionCard {
  const total = cartons * 3200;
  return {
    kind: "order",
    shop,
    amount: total,
    why: cartons > 25 ? "Bigger than her usual 25 cartons" : "Her usual size",
    title: `Order · ${shop}`,
    sub: `${naira(total)} · delivery Saturday`,
    rows: [
      { label: `Indomie Chicken 70g (${cartons})`, amount: total, note: `${cartons} cartons`, proof: "verified" },
      { label: "Van 2 · Saturday", note: "Mushin first" },
    ],
    primary: "Confirm order",
    secondary: "Decline",
    status: "needs",
    doneText: `Confirmed with ${shop} on WhatsApp`,
  };
}

async function order(slug: string, text: string, ep: number) {
  const cartons = Number(/(\d+)\s*(cartons?|ctns?)/i.exec(text)?.[1] ?? 20);
  const shop = shopIn(text, "Mama Bisi");
  if (!(await think(slug, "Order", `${shop} wants ${cartons} cartons. Check her usual size, how she pays and whether the warehouse can cover it before I draft anything.`, ep))) return;
  if (!(await say(slug, "Order", `Drafting ${cartons} cartons for ${shop}. Checking her usual first.`, ep, 700))) return;
  status(slug, "drafting the order");
  if (!(await tool(slug, "Order", "receipt", `Reading ${shop}'s last orders`, ep, { done: `Checked ${shop}'s last 6 orders`, meta: "· usually 25 cartons", detail: { type: "table", head: ["Week", "Cartons", "Paid in"], rows: [["21 Sep", "25", "2 days"], ["28 Sep", "25", "1 day"], ["5 Oct", "24", "2 days"], ["12 Oct", "25", "3 days"], ["19 Oct", "26", "2 days"]] } }))) return;
  if (!(await tool(slug, "Order", "package", "Checking stock", ep, { done: "Checked stock · 86 cartons in the warehouse", ms: 800 }))) return;
  if (!(await post(slug, "Order", { kind: "card", from: "Order", at: Date.now(), card: orderCard(shop, cartons) }, ep, 1000))) return;
  sfx("console", "attention");
  gateLast(slug, "Order");
  await say(slug, "Order", "Nothing is confirmed until you say so.", ep);
  waiting(slug);
}

async function credit(slug: string, text: string, ep: number) {
  const shop = shopIn(text, "Iya Femi");
  if (!(await think(slug, "Credit", `A bigger limit for ${shop} only makes sense if she pays fast and keeps hitting the ceiling. Read 8 weeks of the debt book, then suggest a number with reasons.`, ep))) return;
  if (!(await say(slug, "Credit", `Looking at ${shop}'s last 8 weeks of payments.`, ep, 700))) return;
  status(slug, "reading the debt book");
  if (!(await tool(slug, "Credit", "book-text", "Reading the debt book", ep, { done: `Read 8 weeks of ${shop}'s payments`, detail: { type: "kv", rows: [["Invoices", "8"], ["Average", "₦84,000"], ["Paid in", "1 to 3 days"], ["At the limit", "6 of 8 Fridays"]] } }))) return;
  if (!(await say(slug, "Credit", `${shop} paid every invoice in 3 days or less and hits the limit most Fridays. I'd raise it by half, not more.`, ep, 1500))) return;
  const card: DecisionCard = {
    kind: "credit",
    shop,
    amount: 150000,
    why: "Paid on time 8 weeks in a row",
    title: `New limit · ${shop}`,
    sub: "₦100,000 → ₦150,000",
    rows: [
      { label: "Paid on time", note: "8 of 8 weeks" },
      { label: "Hits the limit", note: "Most Fridays" },
      { label: "Review again", note: "After 4 weeks" },
    ],
    primary: "Approve limit",
    secondary: "Decline",
    status: "needs",
    doneText: "Limit raised to ₦150,000",
  };
  if (!(await post(slug, "Credit", { kind: "card", from: "Credit", at: Date.now(), card }, ep, 1100))) return;
  sfx("console", "attention");
  gateLast(slug, "Credit");
  waiting(slug);
}

async function stock(slug: string, ep: number) {
  if (!(await say(slug, "Stock", "Counting the warehouse and this week's orders.", ep))) return;
  status(slug, "counting Indomie");
  if (!(await tool(slug, "Stock", "package", "Counting the warehouse", ep, { done: "Counted the warehouse · 86 cartons" }))) return;
  if (!(await tool(slug, "Stock", "bar-chart", "Reading this week's orders", ep, { done: "Read this week's orders · 21 cartons a day", ms: 900 }))) return;
  if (!(await say(slug, "Stock", "6 shops are below a week of Indomie. At this pace the warehouse runs out Thursday.", ep, 1600))) return;
  const card: DecisionCard = {
    kind: "stock",
    shop: "Dufil",
    amount: 384000,
    why: "Warehouse runs out Thursday",
    title: "Restock · Indomie Chicken 70g",
    sub: "120 cartons · ₦384,000",
    rows: [
      { label: "In the warehouse", note: "86 cartons", proof: "verified" },
      { label: "Runs out", note: "Thursday", proof: "estimated" },
      { label: "Indomie 70g × 120 cartons", amount: 384000, note: "price list", proof: "verified" },
    ],
    primary: "Approve restock",
    secondary: "Decline",
    status: "needs",
    doneText: "Restock sent to Dufil",
  };
  if (!(await post(slug, "Stock", { kind: "card", from: "Stock", at: Date.now(), card }, ep, 1100))) return;
  sfx("console", "attention");
  gateLast(slug, "Stock");
  waiting(slug);
}

async function brand(slug: string, text: string, ep: number) {
  const name = /indomie/i.test(text) ? "Indomie" : /peak/i.test(text) ? "Peak" : "Hypo";
  if (!(await say(slug, "Brand", `Pulling this week's ${name} sell-out from 214 shops.`, ep))) return;
  status(slug, "writing the report");
  if (!(await tool(slug, "Brand", "bar-chart", "Pulling sell-out", ep, { done: `Pulled ${name} sell-out · 214 shops`, ms: 1300 }))) return;
  const docId = fileDoc({
    title: `${name} sell-out summary`,
    kind: "MD",
    by: "Brand",
    thread: slug,
    body: {
      type: "report",
      rows: [
        { area: "Mushin", cartons: 418, change: "+9%" },
        { area: "Oshodi", cartons: 371, change: "+4%" },
        { area: "Ojota", cartons: 296, change: "−1%" },
        { area: "Idumota", cartons: 262, change: "+12%" },
      ],
    },
    note: `Draft for ${name}'s area manager`,
  });
  if (!(await post(slug, "Brand", { kind: "doc", from: "Brand", at: Date.now(), docId, title: `${name} sell-out summary`, sub: "MD · 214 shops · in Docs" }, ep, 600))) return;
  sfx("console", "ready", { theme: "bubble", emphasis: "subtle" });
  openPanel("Docs", docId);
  if (!(await post(slug, "Brand", { kind: "card", from: "Brand", at: Date.now(), card: brandCard(name) }, ep, 900))) return;
  sfx("console", "attention");
  gateLast(slug, "Brand");
  await say(slug, "Brand", "It's in Docs. Edit anything you like before it goes to the brand.", ep);
  waiting(slug);
}

async function fallback(slug: string, helper: HelperName | "Mimi", ep: number) {
  const lines: Record<HelperName | "Mimi", string> = {
    Mimi: "I can chase payments, take orders, check transfer alerts, watch credit, count stock and write brand reports. Try one of these.",
    Collector: "Got it. I'll keep chasing politely and tell you before any message goes out.",
    Proof: "Noted. Send me any alert or receipt and I'll check it against GTB.",
    Order: "Got it. I'll draft it and wait for your yes before confirming with the shop.",
    Credit: "Noted. I'll watch every limit and only suggest changes with reasons.",
    Stock: "Got it. I'll warn you a week before anything runs out.",
    Brand: "Noted. I'll add it to the next report for the brand.",
  };
  await say(slug, helper, lines[helper], ep);
  status(slug, "waiting for your next message", false, "idle");
  if (helper === "Mimi")
    offer(slug, [
      { label: "Chase everyone over ₦50k", text: "Chase everyone over ₦50k this week", step: "col.start" },
      { label: "Check a transfer alert", text: "Kola Mart sent a transfer alert. Is it real?", step: "prf.recheck" },
      { label: "Write Hypo's report", text: "Write Hypo's weekly sell-out report", step: "brd.new" },
    ]);
}

/* ---------- Proof on the computer ---------- */

function setComputer(patch: (c: ComputerState) => ComputerState) {
  setDemo((s) => ({ ...s, computer: patch(s.computer) }));
}

function step(label: string, detail?: string) {
  setComputer((c) => ({
    ...c,
    steps: [...c.steps.map((s): Step => (s.state === "run" ? { ...s, state: "done" } : s)), { label, detail, at: clock(), state: "run" }],
  }));
}

function finishSteps(activity: string) {
  setComputer((c) => ({
    ...c,
    status: "done",
    activity,
    steps: c.steps.map((s): Step => (s.state === "run" ? { ...s, state: "done" } : s)),
  }));
}

/** Proof reads the GTBank statement on screen, then verifies Joy or flags Kola Mart. */
async function runComputer(ep: number, mode: "verified" | "fake" | "both"): Promise<boolean> {
  setComputer(() => ({ ...idleComputer(), status: "live", activity: "opening GTBank", steps: [] }));
  openPanel("Computer");
  sfx("console", "open", { emphasis: "subtle" });
  step("Opened the GTBank statement", "Coral Lane Trading Ltd · ****4471");
  if (!(await wait(1700, ep, true))) return false;
  setComputer((c) => ({ ...c, activity: "reading GTB statement", cursorRow: 0, tag: "Proof · Ade Stores ₦45,000", rows: c.rows.map((r, i) => (i === 0 ? { ...r, mark: "ok" } : r)) }));
  step("Matched Ade Stores ₦45,000", "TRF 08:42 · Verified");
  if (!(await wait(1800, ep, true))) return false;
  if (mode !== "fake") {
    setComputer((c) => ({ ...c, cursorRow: 1, tag: "Proof · Joy's ₦91,000?", rows: c.rows.map((r, i) => (i === 1 ? { ...r, mark: "hl" } : r)) }));
    step("Looking for Joy Supermarket's POS payment", "POS settlements land in batches");
    if (!(await wait(2800, ep, true))) return false;
    setComputer((c) => ({
      ...c,
      cursorRow: 0,
      tag: "Verified · Joy ₦91,000",
      rows: [
        { date: `23 Oct ${clock()}`, narration: "POS SETTLEMENT JOY SUPERMKT", credit: "91,000.00", mark: "ok", isNew: true },
        ...c.rows.filter((_, i) => i !== 1),
      ],
    }));
    step("Joy's ₦91,000 landed", "POS batch settled · Verified");
    sfx("console", "success", { emphasis: "subtle" });
    if (!(await wait(1600, ep, true))) return false;
  }
  if (mode !== "verified") {
    setComputer((c) => {
      const k = c.rows.findIndex((r) => r.narration.includes("KOLA"));
      return { ...c, cursorRow: k, tag: "No money landed", rows: c.rows.map((r, i) => (i === k ? { ...r, mark: "fake" } : r)) };
    });
    step("Checked Kola Mart's ₦120,000 alert", "No credit on the statement · Fake");
    if (!(await wait(1800, ep, true))) return false;
  }
  finishSteps(mode === "fake" ? "flagged 1 fake alert" : "finished · all matched");
  return true;
}

export async function proofCheck(slug: string, ep: number, mode: "verified" | "fake" | "both") {
  if (!(await say(slug, "Proof", "Checking GTBank now. You can watch on the computer.", ep))) return;
  status(slug, "checking GTB on the computer");
  if (!(await post(slug, "Proof", { kind: "computer", from: "Proof", at: Date.now(), title: "Proof is using the computer", sub: "ibank.gtbank.com · live" }, ep, 500))) return;
  const sid = push(slug, { kind: "step", from: "Proof", variant: "tool", icon: "monitor", text: "Reading the GTBank statement on the computer", state: "run", at: Date.now() });
  if (!(await runComputer(ep, mode))) return;
  const done = getDemo().computer.steps;
  patchMessage(slug, sid, (m) =>
    m.kind === "step"
      ? {
          ...m,
          state: "done",
          text: "Read the GTBank statement on the computer",
          meta: `· ${done.length} steps`,
          detail: { type: "list", items: done.map((x) => ({ icon: "check" as const, text: x.label, meta: x.detail })) },
        }
      : m,
  );
  if (mode !== "fake") {
    if (!(await post(slug, "Proof", joyProof(), ep, 800))) return;
    sfx("console", "success", { emphasis: "subtle" });
    dropFromPlans(slug, "Joy Supermarket");
    if (!(await say(slug, "Proof", "Joy's ₦91,000 landed. Verified, so I took Joy off the reminder plan.", ep))) return;
  }
  if (mode !== "verified") {
    if (!(await post(slug, "Proof", kolaProof(), ep, 800))) return;
    if (!(await say(slug, "Proof", "Kola Mart's ₦120,000 alert is fake. No money landed in GTB.", ep))) return;
  }
  status(slug, "watching GTB alerts", false);
}

const joyProof = (): NewMessage => ({
  kind: "proof",
  from: "Proof",
  at: Date.now(),
  title: "POS settlement",
  meta: `Joy Supermarket · ${clock()}`,
  amount: 91000,
  stamp: "Landed",
  foot: "Joy really paid",
  footSub: "Matched to your GTB account",
  verdict: "verified",
});
const kolaProof = (): NewMessage => ({
  kind: "proof",
  from: "Proof",
  at: Date.now(),
  title: "NIP transfer alert",
  meta: "Kola Mart · 22 Oct 16:05",
  amount: 120000,
  stamp: "No money",
  foot: "Fake alert caught",
  footSub: "Nothing landed in GTB",
  verdict: "fake",
});

/** Removes a paid shop from every pending plan in the thread. */
function dropFromPlans(slug: string, shop: string) {
  patchConversation(slug, (c) => ({
    ...c,
    messages: c.messages.map((m) =>
      m.kind === "card" && m.card.kind === "plan" && m.card.status === "needs"
        ? { ...m, card: rebuildPlan(m.card, m.card.rows.filter((r) => r.label !== shop)) }
        : m,
    ),
  }));
  const plan = pendingCard(slug, "plan");
  const doc = getDemo().docs.find((d) => d.thread === slug && d.body.type === "plan");
  if (plan && doc) {
    setDemo((s) => ({
      ...s,
      docs: s.docs.map((d) =>
        d.id === doc.id ? { ...d, title: plan.card.title, body: { type: "plan", rows: plan.card.rows, total: liveTotal(plan.card.rows) } } : d,
      ),
    }));
    addVersion(doc.id, "Proof", `${shop} paid, removed`);
  }
}

const liveTotal = (rows: CardRow[]) => rows.filter((r) => r.tone !== "Skip").reduce((s, r) => s + (r.amount ?? 0), 0);

function rebuildPlan(card: DecisionCard, rows: CardRow[]): DecisionCard {
  const fresh = reminderPlan(rows);
  return { ...card, title: fresh.title, sub: fresh.sub, rows, goal: fresh.goal, proof: fresh.proof, doneText: fresh.doneText };
}

/* ---------- cards ---------- */

/** What each helper says once its card is approved, and the chips that follow. */
async function afterApprove(slug: string, card: DecisionCard, ep: number) {
  const shop = card.shop ?? "the shop";
  switch (card.kind) {
    case "plan": {
      const doc = getDemo().docs.find((d) => d.thread === slug && d.body.type === "plan");
      if (doc) addVersion(doc.id, "you", "Approved and sent");
      tickLabel(slug, "Send on WhatsApp", "run");
      const live = card.rows.filter((r) => r.tone !== "Skip");
      if (
        !(await tool(slug, "Collector", "send", `Sending to WhatsApp · ${live.length} shops`, ep, {
          done: `Sent to WhatsApp · ${live.length} shops`,
          meta: `· ${clock()}`,
          detail: { type: "table", head: ["Shop", "Owes", "Tone", "Status"], rows: live.map((r) => [r.label, r.amount !== undefined ? naira(r.amount) : "", r.tone ?? "", "Delivered"]) },
          ms: 1200,
        }))
      )
        return;
      tickLabel(slug, "Send on WhatsApp", "done");
      if (!(await say(slug, "Collector", "Sent. I'll watch GTB and tell you as each shop pays.", ep, 900))) return;
      return offer(slug, [{ label: "Who has paid so far?", step: "col.after" }]);
    }
    case "order":
      if (!(await say(slug, "Order", `Confirmed with ${shop}. Van 2 delivers Saturday morning.`, ep, 900))) return;
      return offer(slug, [{ label: "Add a note for the driver", step: "ord.note" }]);
    case "credit":
      await say(slug, "Credit", `${card.doneText}. I'll review it again in 4 weeks.`, ep, 900);
      return;
    case "stock":
      await say(slug, "Stock", "Sent to Dufil. Delivery Tuesday, before the warehouse runs out.", ep, 900);
      return;
    case "brand":
      await say(slug, "Brand", `${card.doneText}, with the PDF attached.`, ep, 900);
      return;
    case "flag":
      if (!(await say(slug, "Proof", "Done. Kola Mart's orders are on hold until cash lands in GTB.", ep, 900))) return;
      return offer(slug, [{ label: "Draft a message to Kola Mart", step: "prf.msg" }]);
    case "match":
      await say(slug, "Proof", `Marked paid in the book: ${shop}, ${naira(card.amount ?? 0)}. No money moved, I only recorded it.`, ep, 900);
      return;
  }
}

/**
 * The owner answers a helper's ask, in Mimi's chat (`via` "mimi": she passes it on) or in the
 * helper's own chat. The ask is one message, so it reads answered in both places at once; the
 * answer lands in the helper's chat and she carries on there.
 */
export function answerAsk(slug: string, messageId: string, text: string, via: "mimi" | "helper") {
  const clean = text.trim();
  const c = findConversation(getDemo(), slug);
  const m = c?.messages.find((x) => x.id === messageId);
  if (!clean || !m || m.kind !== "ask" || m.answered) return;
  const ep = epoch;
  sfx("console", "tap");
  patchMessage(slug, messageId, (x) => (x.kind === "ask" ? { ...x, answered: { text: clean, at: Date.now(), via } } : x));
  if (via === "mimi") event(slug, `Mimi passed your answer to ${m.from}`);
  push(slug, { kind: "text", from: "me", text: clean, at: Date.now() });
  const follow = m.options?.find((o) => o.text === clean || o.label === clean);
  const reply = follow ? `Okay, ${follow.label.charAt(0).toLowerCase()}${follow.label.slice(1)}. I'll carry on from here.` : "Got it, thanks. I'll carry on from here.";
  status(slug, "carrying on", true, "run");
  void say(slug, m.from, reply, ep, 900).then((ok) => ok && status(slug, "waiting for your next message", false, "idle"));
}

/** Approve a card (from its thread, the plan sheet or the Needs you pile: one shared store). */
export function approveCard(slug: string, messageId: string, quiet = false) {
  if (isTourCard(slug)) return tourDecide(messageId, true);
  if (isApiCard(messageId)) return void liveDecide(slug, messageId, true);
  const ep = epoch;
  const c = findConversation(getDemo(), slug);
  const m = c?.messages.find((x) => x.id === messageId);
  if (!m || m.kind !== "card" || m.card.status !== "needs") return;
  if (!quiet) sfx("console", "tap");
  closeSheet();
  offer(slug, undefined);
  patchMessage(slug, messageId, (x) => (x.kind === "card" ? { ...x, card: { ...x.card, status: "sending" } } : x));
  closeGates(slug, messageId, true);
  tickLabel(slug, "Get your approval", "done");
  status(slug, m.card.kind === "plan" ? "sending on WhatsApp" : "saving", true, "run");
  window.setTimeout(() => {
    if (!alive(ep)) return;
    const at = clock();
    patchMessage(slug, messageId, (x) =>
      x.kind === "card" ? { ...x, card: { ...x.card, status: "sent", sentAt: at, sub: x.card.sub.replace("nothing sent yet", `sent ${at}`) } } : x,
    );
    sfx("console", "success", { emphasis: "strong" });
    const more = !!pendingCard(slug);
    status(slug, more ? "waiting on you" : m.card.kind === "plan" ? "watching for replies" : "done", m.card.kind === "plan" && !more, more ? "needs" : "done");
    void afterApprove(slug, m.card, ep);
  }, 1300 * consoleMotion.pace);
}

async function approvePending(slug: string, kind: DecisionCard["kind"] | undefined, ep: number) {
  const m = pendingCard(slug, kind);
  if (!m) {
    const c = findConversation(getDemo(), slug);
    await say(slug, c?.helper ?? "Mimi", "Nothing here is waiting on you right now.", ep);
    return status(slug, "waiting for your next message", false, "idle");
  }
  approveCard(slug, m.id, true);
}

export function declineCard(slug: string, messageId: string) {
  if (isTourCard(slug)) return tourDecide(messageId, false);
  if (isApiCard(messageId)) return void liveDecide(slug, messageId, false);
  sfx("console", "tap");
  const c = findConversation(getDemo(), slug);
  patchMessage(slug, messageId, (x) => (x.kind === "card" ? { ...x, card: { ...x.card, status: "declined" } } : x));
  closeGates(slug, messageId, false);
  tickLabel(slug, "Get your approval", "failed");
  offer(slug, undefined);
  const more = !!pendingCard(slug);
  status(slug, more ? "waiting on you" : "declined by you", false, more ? "needs" : "done");
  if (c) void say(slug, c.helper, "Okay, I've dropped it. Nothing was sent.", epoch, 700);
}

export function setRowTone(slug: string, messageId: string, row: number, tone: Tone) {
  sfx("console", "select");
  let changed: CardRow | undefined;
  patchMessage(slug, messageId, (x) => {
    if (x.kind !== "card") return x;
    const rows = x.card.rows.map((r, i) => (i === row ? { ...r, tone, edited: true } : r));
    changed = rows[row];
    return { ...x, card: rebuildPlan(x.card, rows) };
  });
  syncPlanDoc(slug, changed ? `Set ${changed.label} to ${tone}` : "Edited the plan");
}

export function setPlanMessage(slug: string, messageId: string, text: string) {
  patchMessage(slug, messageId, (x) =>
    x.kind === "card" && x.card.message ? { ...x, card: { ...x.card, message: { ...x.card.message, text } } } : x,
  );
}

function syncPlanDoc(slug: string, note: string) {
  const c = findConversation(getDemo(), slug);
  const card = [...(c?.messages ?? [])].reverse().find((m) => m.kind === "card" && m.card.kind === "plan");
  const doc = getDemo().docs.find((d) => d.thread === slug && d.body.type === "plan");
  if (!card || card.kind !== "card" || !doc) return;
  setDemo((s) => ({
    ...s,
    docs: s.docs.map((d) =>
      d.id === doc.id ? { ...d, title: card.card.title, body: { type: "plan", rows: card.card.rows, total: liveTotal(card.card.rows) } } : d,
    ),
  }));
  addVersion(doc.id, "you", note);
}

export function openSheet(slug: string, messageId: string) {
  sfx("console", "open", { emphasis: "subtle" });
  setDemo((s) => ({ ...s, sheet: { slug, messageId } }));
}
export function closeSheet() {
  if (!getDemo().sheet) return;
  sfx("console", "close", { emphasis: "subtle" });
  setDemo((s) => ({ ...s, sheet: null }));
}

/* ---------- small interactions ---------- */

export function votePoll(slug: string, messageId: string, option: number) {
  const c = findConversation(getDemo(), slug);
  const m = c?.messages.find((x) => x.id === messageId);
  if (!m || m.kind !== "poll" || m.voted === option) return;
  sfx("console", "select");
  patchMessage(slug, messageId, (x) => (x.kind === "poll" ? { ...x, voted: option } : x));
  const choice = m.options[option] ?? "";
  const tone: Tone = /soft/i.test(choice) ? "Soft" : "Firm";
  patchConversation(slug, (cv) => ({
    ...cv,
    messages: cv.messages.map((x) =>
      x.kind === "card" && x.card.kind === "plan" && x.card.status === "needs"
        ? { ...x, card: { ...x.card, rows: x.card.rows.map((r) => (r.label === "Chuks & Sons" ? { ...r, tone } : r)) } }
        : x,
    ),
  }));
  if (m.reply) void say(slug, m.from, m.reply.replace("{choice}", choice.split(",")[0] ?? choice), epoch, 800);
}

export function toggleFan(slug: string, messageId: string) {
  let open = false;
  patchMessage(slug, messageId, (x) => {
    if (x.kind !== "photos") return x;
    open = !x.open;
    return { ...x, open };
  });
  sfx("console", open ? "open" : "close", { emphasis: "subtle" });
}

/**
 * iMessage rules: one reaction per person per message. Picking the same one again removes it;
 * picking another replaces it. One quiet bubble tap when the owner adds one (nothing on remove).
 */
export function react(slug: string, messageId: string, r: string, by = "me") {
  let added = false;
  patchMessage(slug, messageId, (x) => {
    if (!(reactableKinds as readonly string[]).includes(x.kind)) return x;
    const m = x as ReactableMessage;
    const list = m.reactions ?? [];
    const mine = list.find((q) => q.by === by);
    const rest = list.filter((q) => q.by !== by);
    added = mine?.r !== r;
    const next: Reaction[] = added ? [...rest, { by, r, at: Date.now() }] : rest;
    return { ...m, reactions: next.length ? next : undefined } as Message;
  });
  if (added && by === "me") sfx("console", "tap", { theme: "bubble", emphasis: "subtle" });
}

/** Removes one person's reaction (the "who reacted" sheet). */
export function unreact(slug: string, messageId: string, by = "me") {
  patchMessage(slug, messageId, (x) => {
    if (!(reactableKinds as readonly string[]).includes(x.kind)) return x;
    const m = x as ReactableMessage;
    const next = (m.reactions ?? []).filter((q) => q.by !== by);
    return { ...m, reactions: next.length ? next : undefined } as Message;
  });
}

/**
 * Helpers react to the owner now and then: a thumbs up when the owner approves or confirms,
 * "!!" when the message names a big amount (₦100,000 or more). Silent; the helper's reply follows.
 */
function helperReacts(slug: string, messageId: string, text: string, ep: number) {
  const c = findConversation(getDemo(), slug);
  if (!c) return;
  const t = text.toLowerCase();
  const big = [...text.matchAll(/₦\s?([\d,]+)/g)].some((m) => Number(m[1]!.replace(/,/g, "")) >= 100000);
  const r = /\b(approve|confirm|go ahead|send it)\b|^(yes|ok|okay)\b/.test(t) ? "like" : big ? "bang" : null;
  if (!r) return;
  window.setTimeout(() => {
    if (alive(ep)) react(slug, messageId, r, c.helper);
  }, 650 * consoleMotion.pace);
}

/* ---------- panel ---------- */

export function openPanel(tab: PanelTab, docId?: string) {
  setDemo((s) => ({ ...s, panel: { ...s.panel, open: true, tab, docId: docId ?? s.panel.docId } }));
}
export function setPanelTab(tab: PanelTab) {
  sfx("console", "select");
  setDemo((s) => ({ ...s, panel: { ...s.panel, open: true, tab } }));
}
export function setDocFilter(filter: DocFilter) {
  setDemo((s) => ({ ...s, panel: { ...s.panel, filter } }));
}
export function closePanel() {
  setDemo((s) => ({ ...s, panel: { ...s.panel, open: false, full: false } }));
}
export function togglePanel() {
  setDemo((s) => ({ ...s, panel: { ...s.panel, open: !s.panel.open, full: false } }));
}
export function setPanelFull(full: boolean) {
  setDemo((s) => ({ ...s, panel: { ...s.panel, open: true, full } }));
}
/** Leaves the doc reader: back to the docs list at normal width (the sidebar comes back). */
export function closeDocument() {
  sfx("console", "close", { emphasis: "subtle" });
  setDemo((s) => ({ ...s, panel: { ...s.panel, docId: undefined, full: false } }));
}
export function openDoc(docId: string | undefined) {
  setDemo((s) => ({ ...s, panel: { ...s.panel, open: true, tab: "Docs", docId } }));
}

export function pauseComputer() {
  const st = getDemo().computer.status;
  sfx("console", "toggle", { direction: st === "paused" ? "forward" : "back" });
  setComputer((c) => ({ ...c, status: c.status === "paused" ? "live" : c.status === "live" ? "paused" : c.status }));
}
export function takeControl() {
  sfx("console", "tap");
  const before = getDemo().computer;
  setComputer((c) => ({ ...c, status: c.status === "user" ? (c.steps.some((s) => s.state === "run") ? "live" : "done") : "user" }));
  /* both moves write a system event in the thread on screen (RAI-299) */
  const slug = getDemo().active;
  if (!slug) return;
  const at = before.steps.findIndex((s) => s.state === "run");
  if (before.status === "user") event(slug, `Handed back to ${before.helper} · resumes at step ${at >= 0 ? at + 1 : before.steps.length}`);
  else event(slug, `You took control of ${before.helper}'s computer · ${before.helper} is paused`);
}

/* ---------- docs ---------- */

function fileDoc(d: Omit<Doc, "id" | "at" | "versions">): string {
  const id = nextId("doc-");
  const at = clock();
  setDemo((s) => ({ ...s, docs: [{ ...d, id, at, versions: [{ v: 1, by: d.by, at, note: "First draft" }] }, ...s.docs] }));
  return id;
}

function addVersion(docId: string, by: Doc["by"], note: string) {
  setDemo((s) => ({
    ...s,
    docs: s.docs.map((d) =>
      d.id === docId ? { ...d, versions: [{ v: (d.versions[0]?.v ?? 0) + 1, by, at: clock(), note }, ...d.versions] } : d,
    ),
  }));
}

export function editDocNote(docId: string, note: string) {
  const d = getDemo().docs.find((x) => x.id === docId);
  if (!d || d.note === note) return;
  setDemo((s) => ({ ...s, docs: s.docs.map((x) => (x.id === docId ? { ...x, note, noteEdited: true } : x)) }));
  addVersion(docId, "you", "Edited the note");
  sfx("console", "success", { emphasis: "subtle" });
}

export function restoreVersion(docId: string, v: number) {
  sfx("console", "select");
  addVersion(docId, "you", `Restored v${v}`);
}

/* ---------- side chat ---------- */

export function sideSend(text: string, quote?: string) {
  const clean = text.trim();
  if (!clean) return;
  const ep = epoch;
  const id = nextId("q");
  setDemo((s) => ({ ...s, side: [...s.side, { id, from: "me", text: clean, quote, at: Date.now() }], sideTyping: true }));
  sfx("console", "tap");
  const t = clean.toLowerCase();
  let reply = "Noted. I'll keep that out of the thread. Ask me anything about a shop, a payment or a helper.";
  if (/soft/.test(t) && /chuks/.test(t)) {
    reply = "Done. I changed Chuks to Soft in the reminder plan. Nothing sent yet.";
    const c = findConversation(getDemo(), "chase-over-50k");
    const card = [...(c?.messages ?? [])].reverse().find((m) => m.kind === "card" && m.card.kind === "plan" && m.card.status === "needs");
    if (card && card.kind === "card") {
      const row = card.card.rows.findIndex((r) => r.label === "Chuks & Sons");
      if (row >= 0) window.setTimeout(() => alive(ep) && setRowTone("chase-over-50k", card.id, row, "Soft"), 1100);
    }
  } else if (/(late|usually|new)/.test(t)) reply = "New. He paid on time for 11 of the last 12 weeks.";
  else if (/(owe|total|how much|outstanding)/.test(t)) reply = "Across Lagos mainland, 48 shops owe ₦4.82m. Five are past a week.";
  else if (/(joy)/.test(t)) reply = "Joy pays by POS most weeks. Settlements land in GTB a few hours later.";
  else if (/(kola)/.test(t)) reply = "Kola Mart sent one fake alert this month. I'd keep their orders on hold until cash lands.";
  window.setTimeout(() => {
    if (!alive(ep)) return;
    setDemo((s) => ({ ...s, sideTyping: false, side: [...s.side, { id: `${id}r`, from: "Mimi", text: reply, at: Date.now() }] }));
    sfx("console", "ready", { theme: "bubble", emphasis: "subtle" });
  }, 1100 * consoleMotion.pace);
}

/* ---------- automations: create, run (each run opens its own thread) ---------- */

/** Adds an automation made in the wizard; returns its id. Its first run starts straight away. */
export function createAutomation(a: Omit<Automation, "id" | "runs" | "created">): string {
  const n = getDemo().autos.filter((x) => x.created).length + 1;
  const id = `auto-${n}-${Date.now().toString(36).slice(-4)}`;
  setDemo((s) => ({ ...s, autos: [{ ...a, id, created: true, runs: [] }, ...s.autos], automations: { ...s.automations, [id]: true } }));
  sfx("console", "success", { emphasis: "subtle" });
  window.setTimeout(() => runAutomation(id, "Test run"), 400);
  return id;
}

function patchAuto(id: string, patch: (a: Automation) => Automation) {
  setDemo((s) => ({ ...s, autos: s.autos.map((a) => (a.id === id ? patch(a) : a)) }));
}

const dayStamp = () => {
  const d = new Date();
  return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })} · ${clock(d)}`;
};

/** Runs an automation now: a new thread with every stage of the helper's work, logged in run history. */
export function runAutomation(id: string, label = "Manual run"): string | undefined {
  const a = getDemo().autos.find((x) => x.id === id);
  if (!a) return;
  const n = getDemo().counter + 1;
  const slug = `new-${n}`;
  const conv: Conversation = {
    slug,
    title: `${a.title} · ${label.toLowerCase()}`,
    helper: a.helper,
    folder: folderOf[a.helper],
    code: `${codeOf[a.helper]}-${20 + (n % 80)}`,
    state: "run",
    status: "starting the automation",
    working: true,
    ago: "now",
    created: true,
    preview: a.description,
    messages: [{ id: `d${n}`, kind: "date", label: `Today ${clock()}` }],
  };
  const runId = `run-${n}`;
  setDemo((s) => ({ ...s, counter: n, conversations: [conv, ...s.conversations] }));
  patchAuto(id, (x) => ({ ...x, runs: [{ id: runId, at: dayStamp(), status: "run", summary: `${label} · ${a.helper} is working`, thread: slug }, ...x.runs] }));
  const ep = epoch;
  void (async () => {
    push(slug, { kind: "step", from: a.helper, variant: "tool", icon: "refresh-cw", state: "done", text: `Started by automation · **${a.title}**`, meta: `· ${triggerLabel(a.trigger)}`, at: Date.now() });
    let summary = "Finished · nothing needs you";
    let st: "done" | "needs" = "done";
    if (a.helper === "Collector") {
      await collect(slug, ep);
      if (pendingCard(slug)) {
        summary = "Plan ready · waiting on you";
        st = "needs";
      }
    } else {
      await autoGeneric(slug, a, ep);
    }
    if (!alive(ep)) return;
    patchAuto(id, (x) => ({ ...x, runs: x.runs.map((r) => (r.id === runId ? { ...r, status: st, summary } : r)) }));
  })();
  return slug;
}

/** Any other helper: think about the instructions, do the steps, report back. Nothing goes to shops. */
async function autoGeneric(slug: string, a: Automation, ep: number) {
  const plain = a.instructions.split("\n").filter((l) => l.trim() && !l.startsWith("#") && !l.startsWith("- Move") && !l.startsWith("- Message")).slice(0, 3).join(" ").replace(/\s+/g, " ");
  setPlan(slug, a.title, ["Read the instructions", "Gather what it needs", "Check it", "Report to you"]);
  tick(slug, 0, "run");
  if (!(await think(slug, a.helper, `${plain}\n\nScope: ${scopeLabel(a.scope)}. ${a.approval ? "Anything that would go to a shop waits for approval." : "Report only."}`, ep))) return;
  tick(slug, 1, "run");
  const steps: Record<HelperName, [ActivityIcon, string, string][]> = {
    Proof: [["landmark", "Reading the GTBank statement", "Read the GTBank statement · 12 credits today"], ["receipt", "Matching alerts to shops", "Matched 12 of 12 alerts"]],
    Stock: [["package", "Counting the warehouse", "Counted the warehouse · 14 products"], ["bar-chart", "Reading this week's orders", "Read this week's orders · 2 products low"]],
    Brand: [["bar-chart", "Pulling sell-out", "Pulled sell-out · 214 shops"], ["file-text", "Writing the report", "Drafted the report in Docs"]],
    Credit: [["book-text", "Reading the debt book", "Read 4 weeks of payments · 22 credit shops"], ["landmark", "Checking limits", "3 shops hit their limit most weeks"]],
    Order: [["message-square", "Reading WhatsApp orders", "Read this week's orders · 31 shops"], ["users", "Finding quiet shops", "Found 4 shops quiet for 10+ days"]],
    Collector: [],
  };
  for (const [icon, run, done] of steps[a.helper]) {
    if (!(await tool(slug, a.helper, icon, run, ep, { done }))) return;
  }
  tick(slug, 2, "run");
  if (!(await tool(slug, a.helper, "shield-check", "Checking against the rules", ep, { done: "Checked · no money moves, nothing sent to shops", ms: 700 }))) return;
  tick(slug, 3, "run");
  if (!(await say(slug, a.helper, `Done. ${a.lands === "Console thread" ? "Everything is here in this thread." : `I sent you the summary (${a.lands}).`} Nothing went to a shop.`, ep))) return;
  tick(slug, 3, "done");
  status(slug, "finished", false, "done");
}

/* ---------- automations ---------- */

export function toggleAutomation(key: string, on: boolean) {
  setDemo((s) => ({ ...s, automations: { ...s.automations, [key]: on } }));
}

/* ---------- reset and the guided demo ---------- */

export function resetDemo() {
  if (apiActive()) return void liveReset();
  epoch += 1;
  chipBusy = false;
  resetDemoState();
}

export const DEMO_SLUG = "chase-over-50k";
const STORY_ASK = "Chase everyone over ₦50k this week. Polite, but firm past a week.";

/**
 * Empties the story thread so it can be walked from the first message, by chips alone
 * (a presenter tapping, or the guided demo tapping for them).
 */
export function stageStory(playing = false) {
  /* the live demo has no sample story thread: the five-scene tour is its guided demo */
  if (apiActive()) return startTour();
  resetDemo();
  patchConversation(DEMO_SLUG, (c) => ({
    ...c,
    state: "idle",
    status: "ready when you are",
    working: false,
    ago: "now",
    plan: undefined,
    messages: [
      { id: "story-d", kind: "date", label: `Today ${clock()}` },
      { id: "story-hi", kind: "text", from: "Collector", at: 0, text: "Morning, Emeka. 6 shops owe you over ₦50k. Want me to start?" },
    ],
    replies: [
      { label: "Chase everyone over ₦50k", text: STORY_ASK, step: "col.start" },
      { label: "Who owes me the most?", step: "col.start" },
    ],
  }));
  setDemo((s) => ({
    ...s,
    computer: idleComputer(),
    panel: { open: false, tab: "Computer", full: false },
    playing,
    docs: s.docs.filter((d) => d.body.type !== "plan"),
  }));
}

/** Waits until the thread offers chips again (helper finished), or gives up. */
async function chipsReady(slug: string, ep: number, limit = 40000): Promise<boolean> {
  let left = limit;
  while (left > 0) {
    if (!alive(ep)) return false;
    const s = getDemo();
    if (findConversation(s, slug)?.replies?.length && s.typing?.slug !== slug) return true;
    await sleep(150, ep);
    left -= 150;
  }
  return false;
}

/** The guided demo taps the chip whose step matches, like a presenter would. */
async function tapStep(slug: string, step: string, ep: number): Promise<boolean> {
  if (!(await chipsReady(slug, ep))) return false;
  if (!(await wait(1100, ep))) return false;
  const reply = findConversation(getDemo(), slug)?.replies?.find((r) => r.step === step);
  if (!reply) return false;
  await tapChip(slug, reply);
  return alive(ep);
}

/** Auto-plays the collections story through the same chips a presenter taps (~70s). */
/** Plays the five-scene demo in Mimi's chat (live demo and sample data alike). */
export async function playDemo(go: (href: string) => void) {
  startTour();
  go(consoleRoutes.home);
}

/** The older collections story, auto-played through its chips (sample data only). */
export async function playCollectionsStory(go: (href: string) => void) {
  if (apiActive()) return playDemo(go);
  stageStory(true);
  const ep = epoch;
  const slug = DEMO_SLUG;
  go(threadHref(slug));
  if (!(await wait(1200, ep))) return;
  if (!(await tapStep(slug, "col.start", ep))) return;
  if (!(await tapStep(slug, "col.joy", ep))) return;
  if (!(await tapStep(slug, "col.review", ep))) return;
  if (!(await chipsReady(slug, ep))) return;
  if (!(await wait(3600, ep))) return;
  closeSheet();
  if (!(await tapStep(slug, "col.approve", ep))) return;
  if (!(await chipsReady(slug, ep))) return;
  const plan = getDemo().docs.find((d) => d.thread === slug && d.body.type === "plan");
  if (plan) openDoc(plan.id);
  if (!(await wait(3500, ep))) return;
  setDemo((s) => ({ ...s, playing: false }));
}

export function stopDemo() {
  epoch += 1;
  chipBusy = false;
  setDemo((s) => ({ ...s, playing: false, typing: null, draft: null }));
}

export { owner };

/* ---------- composer extras ---------- */

export function sendPhoto(slug: string) {
  if (isApiThread(slug)) return void notify("info", "Photos, voice notes and invoices from the console are not wired to Mimi yet.");
  const ep = epoch;
  push(slug, { kind: "photos", from: "me", at: Date.now(), label: "1 Photo · debt book page", photos: ["/media/photos/photo2-counter-480.webp"] });
  sfx("console", "tap");
  void (async () => {
    if (!(await say(slug, "Proof", "Got the book page. I read 6 lines and matched 5 to GTB. One is still self-reported.", ep, 1600))) return;
    status(slug, "reading your photo", false);
  })();
}

export function sendVoice(slug: string, seconds: number) {
  if (isApiThread(slug)) return void notify("info", "Photos, voice notes and invoices from the console are not wired to Mimi yet.");
  const ep = epoch;
  push(slug, { kind: "voice", from: "me", at: Date.now(), seconds, caption: "Your voice note" });
  sfx("console", "tap");
  const c = findConversation(getDemo(), slug);
  void say(slug, c?.helper ?? "Mimi", "Heard you. I'll keep it polite and tell you before anything goes out.", ep, 1400);
}

export function fileInvoice(slug: string) {
  if (isApiThread(slug)) return void notify("info", "Photos, voice notes and invoices from the console are not wired to Mimi yet.");
  const ep = epoch;
  void (async () => {
    if (!(await say(slug, "Collector", "Pulling the latest invoice from the debt book.", ep, 900))) return;
    const docId = fileDoc({
      title: "Invoice INV-2304 · Bright Star",
      kind: "PDF",
      by: "Collector",
      thread: slug,
      body: { type: "invoice" },
      note: "Due 25 Oct 2026",
    });
    push(slug, { kind: "doc", from: "Collector", at: Date.now(), docId, title: "Invoice INV-2304 · Bright Star", sub: "PDF · in Docs" });
    sfx("console", "ready", { theme: "bubble", emphasis: "subtle" });
    openPanel("Docs", docId);
  })();
}

/** Undo under a done card: the tour's own, or an API Zoho record or limit change. */
export function undoCard(slug: string, messageId: string) {
  if (isTourCard(slug)) return tourUndo(messageId);
  if (isApiCard(messageId)) return void liveUndo(slug, messageId);
}

export function setActiveThread(slug: string | undefined) {
  if (getDemo().active === slug) return;
  setDemo((s) => ({ ...s, active: slug }));
}
