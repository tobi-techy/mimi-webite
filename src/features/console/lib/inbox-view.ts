/**
 * Helper inboxes, read from GET /v1/inbox (docs/HELPER-INBOX-CONTRACT.md, frozen 3 Nov 2026).
 *
 * There is no board (Grok Bot lesson): one item is a dated line inside the conversation of the
 * helper who received it ("Task from Collector"), and its result is a line inside the conversation
 * of whoever sent it. Her conversation is the inbox: nothing here opens a fourth place to look.
 *
 * The owner's own asks arrive as `from_helper: "mimi"`, and they read as her own assignment, never
 * as "from Mimi" to a helper.
 *
 * Three rules hold in this file:
 * - nothing is invented: an item the API did not send never renders, and a value that could be a
 *   machine word is dropped rather than printed as a code (`sentence` below);
 * - the face state is derived here, from `open` and `waiting_on_owner`, so it cannot drift from a
 *   state word the API might one day send;
 * - nothing is required: when this server has no /v1/inbox the console keeps exactly the screens it
 *   had, so the demo build looks as it did before this file existed.
 *
 * Pure (type imports only), so `npm run test:console` covers it under `node --test`.
 */
import type { FaceState } from "../demo/roster";
import type { HelperName, Message, Worker } from "../demo/types";

/* ---------- the contract's six states ---------- */

export type InboxState = "queued" | "working" | "done" | "handed_back" | "failed" | "refused";

/** The states in words, for a line that has to say where a task sits. */
export const stateWords: Record<InboxState, string> = {
  queued: "Waiting to start",
  working: "Working on it",
  done: "Done",
  handed_back: "Handed back to you",
  failed: "Failed",
  refused: "Refused",
};

const stateOf = (s: string | null | undefined): InboxState | null => {
  const k = (s ?? "").trim().toLowerCase();
  return k in stateWords ? (k as InboxState) : null;
};

/** The closed set of helpers, by their contract id. `mimi` is the owner, not a helper. */
const HELPER_IDS: Record<string, HelperName> = {
  order: "Order",
  collector: "Collector",
  credit: "Credit",
  stock: "Stock",
  brand: "Brand",
  proof: "Proof",
};

/** A helper id from the contract, or null: an id the console does not know never becomes a chat. */
export function helperIdOf(id: string | null | undefined): HelperName | null {
  return HELPER_IDS[(id ?? "").trim().toLowerCase().split(/[/:\s]/)[0] ?? ""] ?? null;
}

/** True when this item was the owner's own ask, routed by Mimi. */
export const askedByOwner = (fromHelper: string | null | undefined): boolean => (fromHelper ?? "").trim().toLowerCase() === "mimi";

/* ---------- words, never codes ---------- */

/**
 * A single lower-case token with no space is a machine word ("no_bank_credit", "refused"), and it
 * is never printed. Anything a person would have written is kept, clipped. A figure ("₦160,000")
 * has no space either but keeps its currency mark, so it survives.
 */
export function sentence(value: string | null | undefined, limit = 140): string | null {
  const t = (value ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (!/\s/.test(t) && !/[^\p{L}\p{N}_.:-]/u.test(t) && /^[a-z]/.test(t) && /[a-z]/.test(t)) return null;
  return t.length > limit ? `${t.slice(0, limit - 1).trimEnd()}…` : t;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/* ---------- one item ---------- */

/** One inbox item, with every code already turned into words (or dropped). */
export type InboxItem = {
  taskId: string;
  /** When it was asked, as epoch ms (0 when the API's time is unreadable). */
  at: number;
  /** The helper who received it: her chat carries the task line. Null for an id we do not know. */
  to: HelperName | null;
  toTitle: string;
  /** The owner asked, routed by Mimi: her own assignment, never "from Mimi". */
  fromMimi: boolean;
  /** The helper who sent it, when a helper did. */
  from: HelperName | null;
  fromTitle: string;
  state: InboxState | null;
  /** The ask, in the sender's own words. Empty when the API sent none. */
  ask: string;
  /** What came back, in the API's own words. Empty while there is nothing to report. */
  result: string;
  threadId: string;
  turnId: string;
};

/** What a finished item came back with: the API's own words, never a code, never a sum we made up. */
function resultOf(state: InboxState | null, outcome: string, result: string, reason: string): string {
  const said = sentence(outcome) ?? sentence(result);
  if (said) return said;
  if (!reason) return "";
  if (state === "handed_back") return `handed it back: ${reason}`;
  if (state === "failed" || state === "refused") return `could not finish it: ${reason}`;
  return reason;
}

/** The raw item shape the mapper accepts (the client's ApiInboxItem, typed loosely on purpose). */
export type RawInboxItem = {
  task_id?: string;
  from_helper?: string;
  from_title?: string;
  to_helper?: string;
  to_title?: string;
  skill?: string;
  shop_name?: string;
  ask?: string;
  state?: string;
  reason?: string;
  outcome?: string;
  result?: string;
  thread_id?: string;
  turn_id?: string;
  created_at?: string;
  finished_at?: string;
};

/** One item, mapped. `at` is epoch ms and comes from the API's own time; a bad time is 0, never "now". */
export function mapInboxItem(raw: RawInboxItem, parseTime: (s: string | null | undefined) => number | null): InboxItem | null {
  const taskId = (raw.task_id ?? "").trim();
  const to = helperIdOf(raw.to_helper);
  /* an item we cannot place in a chat is dropped rather than shown in the wrong one */
  if (!taskId || !to) return null;
  const state = stateOf(raw.state);
  const reason = sentence(raw.reason) ?? "";
  return {
    taskId,
    at: parseTime(raw.created_at) ?? parseTime(raw.finished_at) ?? 0,
    to,
    toTitle: (raw.to_title ?? "").trim() || to,
    fromMimi: askedByOwner(raw.from_helper),
    from: helperIdOf(raw.from_helper),
    fromTitle: (raw.from_title ?? "").trim() || helperIdOf(raw.from_helper) || "a helper",
    state,
    ask: sentence(raw.ask) ?? "",
    result: resultOf(state, raw.outcome ?? "", raw.result ?? "", reason),
    threadId: (raw.thread_id ?? "").trim(),
    turnId: (raw.turn_id ?? "").trim(),
  };
}

/* ---------- the lines ---------- */

/** The line in the receiving helper's chat: who asked, and the ask in their own words. */
export function taskLineFor(item: InboxItem): Message | null {
  if (!item.to) return null;
  /* the owner's own ask reads as her own message in the helper's chat (Tobi, 3 Nov 2026) */
  if (item.fromMimi)
    return item.ask ? { id: `api-ib:${item.taskId}`, kind: "text", from: "me", text: item.ask, at: item.at, to: item.to } : null;
  const text = item.ask ? `Task from ${item.fromTitle}: ${clip(item.ask, 90)}` : `Task from ${item.fromTitle}`;
  return { id: `api-ib:${item.taskId}`, kind: "system", text, at: item.at, icon: "message-square", ...(item.turnId ? { turn: item.turnId } : {}) };
}

/**
 * The line in the sender's chat when a helper sent the task: "Handed to Proof: check the
 * screenshot", with the one line that came back under it. `to` is the helper who did the work, so
 * the line opens her chat, where the work is.
 */
export function handoffLineFor(item: InboxItem): Message | null {
  if (!item.to || item.fromMimi) return null;
  const from = item.from ?? item.to;
  return {
    id: `api-ib:${item.taskId}:out`,
    kind: "step",
    from,
    to: item.to,
    variant: "handoff",
    state: "done",
    at: item.at,
    text: item.ask ? clip(`Handed to ${item.toTitle}: ${item.ask}`, 110) : `Handed to ${item.toTitle}`,
    ...(item.result ? { result: item.result } : {}),
    ...(item.turnId ? { turn: item.turnId } : {}),
  };
}

/**
 * The line in Mimi's chat for one of the owner's own asks: the helper's name and what came back,
 * exactly the shape the shop task updates already take there.
 */
export function updateLineFor(item: InboxItem): Message | null {
  if (!item.to || !item.fromMimi || !item.result) return null;
  return {
    id: `api-ib:${item.taskId}:back`,
    kind: "step",
    from: item.to,
    to: item.to,
    variant: "handoff",
    state: "done",
    at: item.at,
    text: clip(`${item.to}: ${item.result}`, 110),
    ...(item.turnId ? { turn: item.turnId } : {}),
  };
}

const atOf = (m: Message): number => ("at" in m && typeof m.at === "number" ? m.at : 0);

/** Helper H's chat: the tasks she received, and what she handed to someone else. */
export function inboxChatLines(items: readonly InboxItem[], helper: HelperName): Message[] {
  const out: Message[] = [];
  for (const item of items) {
    if (item.to === helper) {
      const task = taskLineFor(item);
      if (task) out.push(task);
    }
    if (!item.fromMimi && item.from === helper) {
      const line = handoffLineFor(item);
      if (line) out.push(line);
    }
  }
  return out.sort((a, b) => atOf(a) - atOf(b));
}

/** Mimi's chat: what came back on the owner's own asks (the helper's line, as a step). */
export function inboxMimiLines(items: readonly InboxItem[]): Message[] {
  const out: Message[] = [];
  for (const item of items) if (item.fromMimi) {
    const back = updateLineFor(item);
    if (back) out.push(back);
  }
  return out.sort((a, b) => atOf(a) - atOf(b));
}

/**
 * `lines` with `extra` merged in by time. Returns `lines` itself when there is nothing to add, so a
 * chat with no inbox items renders exactly the feed it rendered before. A leading date line stays
 * first (it labels the day the conversation opened).
 */
export function mergeByTime(lines: Message[], extra: readonly Message[]): Message[] {
  if (!extra.length) return lines;
  const rest = [...lines];
  const head: Message[] = [];
  if (rest[0]?.kind === "date") head.push(rest.shift()!);
  const all = [...rest.map((m, i) => ({ m, i, extra: 0 })), ...extra.map((m, i) => ({ m, i, extra: 1 }))];
  all.sort((a, b) => atOf(a.m) - atOf(b.m) || a.extra - b.extra);
  return [...head, ...all.map((x) => x.m)];
}

/* ---------- the helper lines (the roster's one sentence each) ---------- */

/** One helper, as the API reports her: two counts and one sentence. */
export type HelperLine = { helper: HelperName; helperName: string; open: number; waitingOnOwner: number; outcome: string };

export type RawHelperLine = { helper?: string; helper_name?: string; open?: number; waiting_on_owner?: number; outcome?: string };

const count = (n: unknown): number => (typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** The API's own helper lines, for the helpers the console knows. Nothing is carried over. */
export function mapHelperLines(raw: readonly RawHelperLine[] | null | undefined): HelperLine[] {
  const out: HelperLine[] = [];
  for (const line of raw ?? []) {
    const helper = helperIdOf(line.helper);
    if (!helper) continue;
    out.push({
      helper,
      helperName: (line.helper_name ?? "").trim() || helper,
      open: count(line.open),
      waitingOnOwner: count(line.waiting_on_owner),
      outcome: sentence(line.outcome) ?? "",
    });
  }
  return out;
}

/**
 * The face the console shows, derived from the two counts (the API sends no state word so the two
 * cannot drift). `blocked` is deliberately not derived: the contract carries no signal for it, and
 * a blocked face would be a claim nothing here supports.
 */
export function faceStateOf(line: HelperLine): FaceState {
  if (line.open > 0) return line.waitingOnOwner > 0 ? "waiting" : "working";
  return line.outcome ? "done" : "idle";
}

/** The helper's line from the API's own list, or undefined when this server did not send one. */
export function helperLineIn(lines: readonly HelperLine[] | null | undefined, helper: Worker | string): HelperLine | undefined {
  const name = helperIdOf(String(helper));
  return (lines ?? []).find((l) => l.helper === name);
}
