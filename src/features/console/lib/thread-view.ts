/**
 * How a thread reads (Tobi, 29 Oct 2026: "keep ui clean, maybe remove the thinking state"). Pure
 * helpers shared by the feed and the header, kept dependency-free so node --test can run them.
 */
type Line = { kind: string; from?: string; live?: boolean; state?: string; text?: string };

/** Reasoning and tool steps: the work trail that hides unless consoleThread.showWork is on. */
export const isWorkLine = (m: Line): boolean => m.kind === "thought" || m.kind === "step";

/** The messages a thread shows: everything, or everything but the work trail. */
export function visibleMessages<T extends Line>(list: T[], showWork: boolean): T[] {
  return showWork ? list : list.filter((m) => !isWorkLine(m));
}

/** A work line still running (live reasoning or a running step). */
const isLive = (m: Line) => (m.kind === "thought" && !!m.live) || (m.kind === "step" && m.state === "run");

/**
 * Who is working right now and what on, read from the newest live work line: drives the typing
 * dots in the thread and the one-line status under the header name. Null when nobody is.
 */
export function liveWork(list: Line[]): { who: string; doing: string } | null {
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i]!;
    if (!isLive(m) || !m.from || m.from === "me") continue;
    const doing = m.kind === "thought" ? "Thinking" : (m.text ?? "").replace(/\*\*/g, "").trim() || "Working";
    return { who: m.from, doing };
  }
  return null;
}

/** The header's one-line status: the live step text ("Checking Ikeja payments…"), else a plain fallback. */
export function statusLine(live: { doing: string } | null, fallback: string): string {
  if (!live) return fallback;
  const t = live.doing.replace(/[.…\s]+$/, "");
  return `${t}…`;
}

/**
 * Splits a long helper reply into 2–3 short consecutive bubbles at sentence ends (Grok Bot style:
 * ack, progress, result; never a wall of text). Short replies, and anything with line breaks or a
 * list, stay one bubble.
 */
export function splitReply(text: string, max = 150): string[] {
  const t = text.trim();
  if (t.length <= max || /\n/.test(t)) return [t];
  const sentences = t
    .match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)
    ?.map((s) => s.trim())
    .filter(Boolean) ?? [t];
  if (sentences.length < 2) return [t];
  const parts = Math.min(3, Math.max(2, Math.ceil(t.length / max)));
  const target = t.length / parts;
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    const room = out.length < parts - 1;
    if (cur && room && cur.length + s.length + 1 > target) {
      out.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) out.push(cur);
  // never leave a tiny tail bubble: fold it back into the one before
  if (out.length > 1 && out[out.length - 1]!.length < 24) {
    const last = out.pop()!;
    out[out.length - 1] = `${out[out.length - 1]} ${last}`;
  }
  return out;
}

/** Message time for the long-press menu ("Today 9:41 AM"; older days get the date). */
export function timeLabel(at: number, now = Date.now()): string {
  const d = new Date(at);
  const n = new Date(now);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 86400000);
  if (diff === 0) return `Today ${time}`;
  if (diff === 1) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ${time}`;
}

/**
 * The seeded threads get the same treatment as live demo replies: a long helper text becomes 2–3
 * consecutive bubbles. Ids stay stable (`id`, `id-2`, `id-3`); reactions stay on the last bubble.
 */
export function splitLongReplies<T extends { kind: string }>(list: T[]): T[] {
  const out: T[] = [];
  for (const m of list) {
    const t = m as unknown as {
      kind: string;
      id: string;
      from: string;
      text: string;
      reactions?: unknown;
      read?: boolean;
    };
    if (t.kind !== "text" || t.from === "me" || typeof t.text !== "string") {
      out.push(m);
      continue;
    }
    const parts = splitReply(t.text);
    if (parts.length < 2) {
      out.push(m);
      continue;
    }
    parts.forEach((text, i) => {
      const last = i === parts.length - 1;
      const piece: Record<string, unknown> = { ...t, id: i ? `${t.id}-${i + 1}` : t.id, text };
      if (!last) delete piece.reactions;
      out.push(piece as unknown as T);
    });
  }
  return out;
}
