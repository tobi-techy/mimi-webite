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

/**
 * Helper-to-helper chatter: a run of 3+ consecutive text messages between helpers (not you, not
 * Mimi) with at least two different speakers. The feed folds each run into one quiet row
 * ("3 messages between Collector and Credit") and Mimi's own message after it is the answer.
 * Returns each run's start index, its length and the helpers in order of first appearance.
 */
export function chatterRuns(list: Line[], min = 3): { start: number; count: number; names: string[] }[] {
  const out: { start: number; count: number; names: string[] }[] = [];
  const chatter = (m: Line) => m.kind === "text" && !!m.from && m.from !== "me" && m.from !== "Mimi";
  for (let i = 0; i < list.length;) {
    if (!chatter(list[i]!)) {
      i++;
      continue;
    }
    let j = i;
    const names: string[] = [];
    while (j < list.length && chatter(list[j]!)) {
      if (!names.includes(list[j]!.from!)) names.push(list[j]!.from!);
      j++;
    }
    if (j - i >= min && names.length >= 2) out.push({ start: i, count: j - i, names });
    i = j;
  }
  return out;
}

/** "Collector and Credit", "Collector, Credit and Proof". */
export function joinNames(names: string[]): string {
  return names.length < 2 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** A step's text for the Steps sheet: one plain line, no markdown marks or raw tokens. */
export function stepLine(text: string): string {
  return text
    .replace(/\*\*|`|==|~~/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Window event the Steps sheet fires so the composer shows "Steering: <task>" and takes focus. */
export const STEER_EVENT = "mc:steer";

/* ---------- task state, proof and who touched it last (Lovin thread replies, 29 Oct 2026) ---------- */

export type TaskState = "working" | "waiting" | "needs" | "stuck" | "done" | "idle";
export const taskStateLabel: Record<TaskState, string> = {
  working: "Working",
  waiting: "Waiting",
  needs: "Needs you",
  stuck: "Stuck",
  done: "Done",
  idle: "Idle",
};

type TaskLike = {
  state: string;
  messages: {
    kind: string;
    from?: string;
    live?: boolean;
    state?: string;
    variant?: string;
    card?: { status?: string };
  }[];
};

/**
 * One state per task: working while a step or reasoning is live, needs you while a card or gate
 * waits on the owner, stuck when the newest step failed and nothing came after, done when finished,
 * waiting when the task is open but nobody is working on it right now.
 */
export function taskState(c: TaskLike): TaskState {
  const ms = c.messages;
  if (ms.some((m) => (m.kind === "thought" && m.live) || (m.kind === "step" && m.state === "run")))
    return "working";
  if (
    ms.some(
      (m) =>
        (m.kind === "card" && m.card?.status === "needs") ||
        (m.kind === "step" && m.variant === "gate" && m.state === "wait"),
    )
  )
    return "needs";
  const last = [...ms].reverse().find((m) => m.kind !== "date" && m.kind !== "event");
  if (last?.kind === "step" && last.state === "failed") return "stuck";
  if (c.state === "done") return "done";
  if (c.state === "needs") return "needs";
  if (c.state === "run") return "waiting";
  return "idle";
}

/** The finish line for a done task: its proof, or "Check needed" when it stopped without one. */
export function finishLine(state: TaskState, proof?: string): string | null {
  if (state !== "done") return null;
  return proof?.trim() ? proof.trim() : "Check needed";
}

/** Who last changed the task (the newest helper or Mimi message), for "Updated by Collector · 2m". */
export function updatedBy(c: TaskLike): string | null {
  for (let i = c.messages.length - 1; i >= 0; i--) {
    const f = c.messages[i]!.from;
    if (f && f !== "me") return f;
  }
  return null;
}

/** How long the typing dots show before a helper message: 600–1400ms by length, capped at 1.6s. */
export function typingMs(text: string, pace = 1, reduced = false): number {
  if (reduced) return 300;
  return Math.round(Math.min(1600, Math.max(600, 520 + text.length * 8)) * pace);
}
