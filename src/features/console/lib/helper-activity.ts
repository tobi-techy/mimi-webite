import type { Conversation, HelperName, Message } from "../demo/types";

/**
 * The live demo files every answer in the owner's one thread with Mimi, whichever helper wrote it
 * (Collector, Credit, Proof…). The sidebar still has one row per helper, so each row reads that
 * helper's own lines out of the live threads: her newest message, when it came, how many arrived
 * since the owner last opened her. Pure (type imports only) so `npm run test:console` covers it.
 */

type Speaking = HelperName | "Mimi";

/** "1 thing needs you", "3 things need you". */
export const needsLine = (n: number): string => `${n} ${n === 1 ? "thing needs" : "things need"} you`;

/** One line for a sidebar preview, or null for lines that are not a message (dates, events, steps). */
export function previewOf(m: Message): string | null {
  const flat = (s: string) =>
    s
      .replace(/\*\*|__|`|==|\[\^\d+\]/g, "")
      .replace(/\[\[[a-z]+:([^\]]+)\]\]/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*(?:[-*•]|\d+[.)]|#+)\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  switch (m.kind) {
    case "text":
      return flat(m.text) || null;
    case "card":
      return flat(m.card.title) || null;
    case "answer": {
      const t = m.blocks.find((b) => b.type === "text");
      return t && t.type === "text" ? flat(t.text) || null : "Sent an answer";
    }
    case "voice":
      return "Voice note";
    case "photos":
      return m.label || "Photo";
    case "file":
      return m.name || "File";
    case "doc":
    case "computer":
      return flat(m.title) || null;
    case "poll":
      return flat(m.question) || null;
    case "proof":
      return flat(m.title) || null;
    default:
      return null;
  }
}

const fromOf = (m: Message): string | undefined => ("from" in m ? (m.from as string) : undefined);
const atOf = (m: Message): number => ("at" in m && typeof m.at === "number" ? m.at : 0);

export type HelperActivity = {
  /** Her newest line: preview text and when it came (ms). */
  last: { text: string; at: number } | null;
  /** Lines she has written in the live threads. */
  count: number;
  /** Lines that came after `seenAt` (the owner has not opened her since). */
  unread: number;
  /** The thread her newest line is in: the row opens it. */
  slug?: string;
};

/**
 * What one helper has said across the live threads. A thread of her own counts whole (its
 * preview and age); in a shared thread only the lines `from` her count.
 */
export function helperActivity(conversations: Conversation[], name: Speaking, seenAt: number): HelperActivity {
  let last: HelperActivity["last"] = null;
  let slug: string | undefined;
  let count = 0;
  let unread = 0;
  for (const c of conversations) {
    for (const m of c.messages) {
      if (fromOf(m) !== name) continue;
      const text = previewOf(m);
      if (text === null) continue;
      count++;
      const at = atOf(m);
      if (at > seenAt) unread++;
      if (!last || at >= last.at) {
        last = { text, at };
        slug = c.slug;
      }
    }
  }
  return { last, count, unread, slug };
}

/**
 * One helper's side of a shared thread: her lines, each with the owner's messages that asked for
 * it (the run of "me" lines right before her answer) and the date line above. Other helpers' and
 * Mimi's answers are left out. The owner's newest asks that nobody has answered yet stay at the
 * end, with any note under them (a refused send), so what the owner just sent never vanishes.
 */
export function helperExchange(messages: Message[], helper: Speaking): Message[] {
  const out: Message[] = [];
  let date: Message | null = null;
  let lastDate: Message | null = null;
  /* the owner's open asks (and notes under them) since the last answer */
  let asks: Message[] = [];
  const pushDate = () => {
    if (date && date !== lastDate) {
      out.push(date);
      lastDate = date;
    }
  };
  for (const m of messages) {
    if (m.kind === "date") {
      date = m;
      continue;
    }
    /* work lines (reasoning, tool steps, activity) belong to whoever answers next: skipped */
    if (m.kind === "thought" || m.kind === "step" || m.kind === "system") continue;
    const who = fromOf(m);
    if (who === "me" || m.kind === "event") {
      asks.push(m);
      continue;
    }
    if (who === helper) {
      pushDate();
      out.push(...asks, m);
      asks = [];
      continue;
    }
    /* Mimi or another helper answered those asks */
    if (who !== undefined) asks = [];
  }
  if (asks.some((m) => fromOf(m) === "me")) {
    pushDate();
    out.push(...asks);
  }
  return out;
}
