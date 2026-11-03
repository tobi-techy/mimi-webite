import type { AskAnswer, HelperName, Message, Worker } from "../demo/types";

/**
 * Every helper has her own chat (Tobi, 31 Oct 2026). Whatever the owner types in a helper's chat
 * goes to that helper and her answer lands there. When one helper hands a job to another, the chat
 * that handed it over keeps one small line ("Handed to Order: …", with a one-line result) and the
 * work itself lives in the other helper's chat. Pure (type imports only) so `npm run test:console`
 * covers it.
 *
 * Both the sample threads and the live demo's one shared thread with Mimi read through these:
 * - `ownChat`: a conversation as its own helper's chat (the handed-over work folded away);
 * - `borrowedChat`: the part of someone else's conversation that belongs in this helper's chat.
 */

type Speaking = Worker | "me";

const fromOf = (m: Message): Speaking | undefined => ("from" in m ? (m.from as Speaking) : undefined);
const turnOf = (m: Message): string | undefined => ("turn" in m && typeof m.turn === "string" && m.turn ? m.turn : undefined);
type Handoff = Extract<Message, { kind: "step" }>;
const isHandoff = (m: Message): m is Handoff => m.kind === "step" && m.variant === "handoff" && !!m.to;

/** One plain line for the result note, or null for lines that are not a message. */
function noteOf(m: Message): string | null {
  const flat = (s: string) =>
    s
      .replace(/\*\*|__|`|==|\[\^\d+\]/g, "")
      .replace(/\[\[[a-z]+:([^\]]+)\]\]/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  switch (m.kind) {
    case "text":
      return flat(m.text) || null;
    case "answer": {
      const t = m.blocks.find((b) => b.type === "text");
      return t && t.type === "text" ? flat(t.text) || null : "Sent an answer";
    }
    case "card":
      return flat(m.card.title) || null;
    case "proof":
      return flat(m.title) || null;
    case "ask":
      return "Needs your answer";
    default:
      return null;
  }
}

const clip = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The task part of a handoff line ("check Ade Stores" from "Collector asked **Proof** to check Ade Stores"). */
export function handoffTask(text: string): string {
  const t = text.replace(/\*\*/g, "").trim();
  const m = /^\w+ asked \w+ (?:to |about )?(.+)$/.exec(t);
  if (m) return /^\w+ asked \w+ about /.test(t) ? `about ${m[1]}` : m[1]!;
  return t.replace(/^Handed to \w+:?\s*/, "");
}

/**
 * A conversation as its own helper's chat. The work a handoff passed to another helper is folded
 * into the handoff line (with a one-line result from her first answer), and what the owner typed
 * in another helper's chat is left out: it belongs there.
 */
export function ownChat(messages: Message[], owner: Worker): Message[] {
  /* live: each turn's handoff (who took it, and whether the owner picked her) */
  const byTurn = new Map<string, { to: HelperName; via?: string }>();
  for (const m of messages) if (isHandoff(m) && m.turn) byTurn.set(m.turn, { to: m.to!, via: m.via });
  const away = (turn?: string) => {
    const h = turn ? byTurn.get(turn) : undefined;
    return h && h.to !== owner ? h : undefined;
  };
  const out: Message[] = [];
  const lines = new Map<string, number>();
  let current: { to: HelperName; at: number } | null = null;
  for (const m of messages) {
    const who = fromOf(m);
    const turn = turnOf(m);
    if (who === "me") {
      if (m.kind === "text" && m.to && m.to !== owner) continue;
      if (away(turn)?.via === "assign") continue;
      out.push(m);
      continue;
    }
    if (isHandoff(m) && m.to !== owner) {
      if (m.turn && m.via === "assign") continue;
      /* sample lines read "Collector asked **Proof** to check Ade Stores": the same plain form as live */
      out.push({ ...m, text: m.turn ? m.text : `Handed to ${m.to}: ${handoffTask(m.text)}`, result: undefined, peer: undefined });
      current = { to: m.to!, at: out.length - 1 };
      if (m.turn) lines.set(m.turn, out.length - 1);
      continue;
    }
    if (m.kind === "event" && current && m.text === `Handed to ${current.to}`) continue;
    const h = away(turn);
    const live = h && who === h.to ? (h.via === "assign" ? -1 : (lines.get(turn!) ?? -1)) : undefined;
    const sample = !turn && current && who === current.to ? current.at : undefined;
    const at = live ?? sample;
    if (at !== undefined) {
      const line = out[at];
      if (line && isHandoff(line) && !line.result) {
        const note = noteOf(m);
        if (note) out[at] = { ...line, result: clip(note) };
      }
      continue;
    }
    out.push(m);
  }
  return out;
}

/**
 * The part of a conversation owned by someone else that belongs in `who`'s chat: from each
 * handoff to her, a line saying who handed it over, then her own work. In the live demo's shared
 * thread the turns the owner sent from her chat show whole (the owner's ask, then her answer), as
 * do the owner's messages typed in her chat that the API has not filed yet.
 */
export function borrowedChat(messages: Message[], who: HelperName, owner: Worker = "Mimi"): Message[] {
  const byTurn = new Map<string, Handoff>();
  for (const m of messages) if (isHandoff(m) && m.turn) byTurn.set(m.turn, m);
  const out: Message[] = [];
  let date: Message | null = null;
  let lastDate: Message | null = null;
  let inSample = false;
  let lastAsk: string | undefined;
  const push = (m: Message) => {
    if (date && date !== lastDate) {
      out.push(date);
      lastDate = date;
    }
    out.push(m);
  };
  for (const m of messages) {
    if (m.kind === "date") {
      date = m;
      continue;
    }
    const sp = fromOf(m);
    const turn = turnOf(m);
    const h = turn ? byTurn.get(turn) : undefined;
    if (sp === "me") {
      if (m.kind === "text") lastAsk = m.text;
      const mine = (m.kind === "text" && m.to === who) || (h?.to === who && h.via === "assign");
      if (mine) push(m);
      continue;
    }
    if (m.kind === "event") {
      /* a note under an ask typed here (a refused send) stays with it */
      const prev = out.at(-1);
      if (prev && fromOf(prev) === "me" && !/^Handed to /.test(m.text)) push(m);
      continue;
    }
    if (isHandoff(m)) {
      if (m.to !== who) {
        inSample = false;
        continue;
      }
      if (m.turn && m.via === "assign") continue;
      /* the line pointing back to the chat it came from */
      const from = (m.turn ? owner : m.from) as Worker;
      const task = m.turn ? lastAsk : handoffTask(m.text);
      push({
        ...m,
        id: `${m.id}:in`,
        peer: from,
        result: undefined,
        text: task ? `From ${from}: ${clip(task.replace(/\s+/g, " ").trim(), 72)}` : `From ${from}`,
      });
      inSample = !m.turn;
      continue;
    }
    if (sp !== who) continue;
    if (turn ? h?.to === who : inSample) push(m);
  }
  return out;
}

/* ---------- asks: "Needs you" in Mimi's chat, the question in the helper's ---------- */

export type AskMessage = Extract<Message, { kind: "ask" }>;

/**
 * Where an ask stands. A local answer (given in this tab, from either chat) wins; otherwise, in
 * the live demo, the owner's first later message to the same helper counts as the answer.
 */
export function askAnswer(ask: AskMessage, after: Message[], local?: AskAnswer | null, helperOfTurn?: (turn: string) => string | undefined): AskAnswer | undefined {
  if (ask.answered) return ask.answered;
  if (local) return local;
  if (!helperOfTurn) return undefined;
  for (const m of after) {
    if (m.kind !== "text" || m.from !== "me" || !m.turn) continue;
    if (helperOfTurn(m.turn) === ask.from) return { text: m.text, at: m.at, via: "helper" };
  }
  return undefined;
}

/** Every ask across the conversations, oldest first, with its slug (Mimi's "Needs you" reads these). */
export function asksIn<C extends { slug: string; messages: Message[] }>(conversations: C[]): { slug: string; ask: AskMessage }[] {
  const out: { slug: string; ask: AskMessage }[] = [];
  for (const c of conversations) for (const m of c.messages) if (m.kind === "ask") out.push({ slug: c.slug, ask: m });
  return out.sort((a, b) => a.ask.at - b.ask.at);
}

/* ---------- routing: a message typed in a helper's chat goes to that helper ---------- */

const ASSIGNABLE = ["order", "collector", "credit", "stock", "brand", "proof", "mimi"] as const;

/**
 * The API's `assign_to` for a message typed in `chat` (POST /v1/turns, handoffs contract): the
 * helper's own id, so the API routes it to her and files her answer under her. Mimi's chat sends
 * none and lets Mimi route.
 */
export function assignFor(chat: Worker | undefined | null): string | undefined {
  if (!chat || chat === "Mimi") return undefined;
  const id = chat.toLowerCase();
  return (ASSIGNABLE as readonly string[]).includes(id) ? id : undefined;
}

/* ---------- Mimi's chat: one-line updates from each helper (Tobi, 3 Nov 2026) ---------- */

/** A helper's task that came from a shop (or rep): her inbox holds it; Mimi's chat gets one line. */
export type ShopTask = { slug: string; helper: Worker; shopName?: string; messages: Message[] };

const turnOfAny = (m: Message): string | undefined =>
  "turn" in m && typeof m.turn === "string" && m.turn ? m.turn : undefined;
const atOf = (m: Message): number | undefined => ("at" in m && typeof m.at === "number" ? m.at : undefined);

/** One plain update for a helper's piece of work: her card first, then her question, then her reply. */
function updateNote(lines: Message[], shop: string): string | null {
  const card = lines.find((m): m is Extract<Message, { kind: "card" }> => m.kind === "card");
  if (card) {
    const t = noteOf(card) ?? "";
    return card.card.status === "needs" ? `${t}, waiting for your approval` : t;
  }
  if (lines.some((m) => m.kind === "ask")) return "needs your answer";
  const sys = [...lines].reverse().find((m) => m.kind === "system" && / replied to /.test(m.text));
  if (sys && sys.kind === "system") return `replied to ${shop}`;
  for (const m of lines) {
    if (fromOf(m) === "me" || m.kind === "system") continue;
    const n = noteOf(m);
    if (n) return n;
  }
  return null;
}

function updateLine(id: string, who: HelperName, at: number, text: string, turn?: string): Handoff {
  return {
    id,
    kind: "step",
    from: who,
    at,
    variant: "handoff",
    to: who,
    state: "done",
    text: clip(`${who}: ${text}`, 110),
    ...(turn ? { turn } : {}),
  };
}

/**
 * The helper a turn group belongs to: the speaker the API filed that turn under (the mapper keeps
 * each line's turn), falling back to the task's own helper.
 */
function helperIn(lines: Message[], fallback: Worker): Worker {
  for (const m of lines) {
    const f = fromOf(m);
    if (f && f !== "me" && f !== "Mimi") return f;
  }
  return fallback;
}

/**
 * Every shop task as one update line each (newest work per turn), for Mimi's chat. Each line is
 * attributed to the helper who worked that turn, not to the thread's helper today: a thread that
 * moved to another helper keeps naming the helper who did each piece of work.
 */
export function shopUpdates(tasks: ShopTask[]): Message[] {
  const out: Message[] = [];
  for (const t of tasks) {
    const shop = t.shopName || "a shop";
    const turns = new Map<string, Message[]>();
    for (const m of t.messages) {
      const k = turnOfAny(m) ?? (m.kind === "card" ? "cards" : undefined);
      if (!k) continue;
      turns.set(k, [...(turns.get(k) ?? []), m]);
    }
    for (const [k, lines] of turns) {
      const who = helperIn(lines, t.helper);
      /* Mimi's own turns are in her chat whole: no update line repeating them */
      if (who === "Mimi") continue;
      const at = Math.max(...lines.map((m) => atOf(m) ?? 0));
      const note = updateNote(lines, shop) ?? `working on a task from ${shop}`;
      out.push(updateLine(`upd:${t.slug}:${k}`, who as HelperName, at, note, k === "cards" ? undefined : k));
    }
  }
  return out.sort((a, b) => (atOf(a) ?? 0) - (atOf(b) ?? 0));
}

/**
 * Mimi's chat in the API build. What the owner said to Mimi and what Mimi said back stay whole.
 * Work a helper took on never shows here: a task Mimi handed over reads "Handed to Collector: …"
 * until the helper has a result, then "Collector: reminder sent to Mama Sola"; a task the owner gave
 * a helper in her own chat, and every task from a shop, adds one such line. Each line opens the
 * helper's chat, where the work is.
 */
export function mimiFeed(owner: Message[], tasks: ShopTask[] = []): Message[] {
  /* turns the owner typed straight into a helper's chat: one update each, from her first result */
  const assigned = new Map<string, HelperName>();
  for (const m of owner) if (isHandoff(m) && m.turn && m.via === "assign") assigned.set(m.turn, m.to!);
  const direct: Message[] = [];
  /* the newest note for a turn wins: an interim reply must not outlive the helper's result */
  const latest = new Map<string, { note: string; at: number }>();
  for (const m of owner) {
    const turn = turnOf(m);
    const who = turn ? assigned.get(turn) : undefined;
    if (!turn || !who || fromOf(m) !== who) continue;
    const note = m.kind === "card" ? updateNote([m], "") : m.kind === "ask" ? "needs your answer" : noteOf(m);
    if (!note) continue;
    const at = atOf(m) ?? 0;
    const prev = latest.get(turn);
    if (!prev || at >= prev.at) latest.set(turn, { note, at });
  }
  for (const [turn, v] of latest) direct.push(updateLine(`upd:${turn}`, assigned.get(turn)!, v.at, v.note, turn));
  const base = ownChat(owner, "Mimi").map((m) =>
    isHandoff(m) && m.result ? { ...m, text: clip(`${m.to}: ${m.result}`, 110), result: undefined } : m,
  );
  const extra = [...direct, ...shopUpdates(tasks)].sort((a, b) => (atOf(a) ?? 0) - (atOf(b) ?? 0));
  if (!extra.length) return base;
  /* each update goes in by time, after the newest line at or before it */
  const out = [...base];
  for (const u of extra) {
    const at = atOf(u) ?? 0;
    let i = out.length;
    while (i > 0) {
      const t = atOf(out[i - 1]!);
      if (t === undefined || t <= at) break;
      i -= 1;
    }
    out.splice(i, 0, u);
  }
  return out;
}

/** A helper's inbox: her shop tasks (each a section) as she works them. Shop words never show. */
export function shopTaskLines(t: ShopTask): Message[] {
  return t.messages.filter((m) => m.kind !== "text" || fromOf(m) !== "me");
}
