import type { Conversation, DemoState, HelperName } from "@/features/console/demo/types";

/**
 * The team roster (Grok Bot lesson: a roster of helpers, not a list of chats). One row per
 * helper plus Mimi, each with a face that carries state, an outcome preview and today's cost.
 * Demo data only: the outcomes and costs below are synthetic and match the seeded threads.
 */

/** What a helper's face shows. Mapped from job state in the product (RAI-298 approach 1). */
export type FaceState = "idle" | "working" | "waiting" | "blocked" | "done";
export type RosterName = HelperName | "Mimi";

export const faceStateLabel: Record<FaceState, string> = {
  idle: "Idle",
  working: "Working",
  waiting: "Waiting on you",
  blocked: "Blocked",
  done: "Done",
};

type RosterSeed = {
  /** Seeded state; live runs and approvals move it (see `rosterOf`). */
  base: FaceState;
  /** One line, written as an outcome. */
  outcome: string;
  /** Outcome once everything waiting on the owner is decided. */
  settled: string;
  /** The current step, shown on hover or long-press. */
  step: string;
  /** Naira spent on this helper today (model + tools). */
  costToday: number;
  /** Steps run today. */
  steps: number;
};

export const rosterSeed: Record<RosterName, RosterSeed> = {
  Mimi: {
    base: "idle",
    outcome: "Team on track · routing your asks",
    settled: "All clear · team on track",
    step: "Waiting for your next ask",
    costToday: 12,
    steps: 9,
  },
  Order: {
    base: "working",
    outcome: "Mama Bisi's 40 cartons ready · Van 2 at 14 stops",
    settled: "Mama Bisi's order confirmed · Van 2 at 14 stops",
    step: "Planning Saturday for Van 2 · 14 stops, Mushin first",
    costToday: 38,
    steps: 22,
  },
  Collector: {
    base: "waiting",
    outcome: "Chased 5 shops, ₦385,900 owed · plan waiting",
    settled: "Reminders sent · watching for replies",
    step: "Waiting on you to approve the reminder plan",
    costToday: 112,
    steps: 41,
  },
  Credit: {
    base: "waiting",
    outcome: "Iya Femi to ₦150,000? 8 weeks on time",
    settled: "Iya Femi's new limit saved · 47 shops in range",
    step: "Waiting on you: Iya Femi's new limit",
    costToday: 21,
    steps: 11,
  },
  Stock: {
    base: "working",
    outcome: "Indomie runs out Thursday · counting the warehouse",
    settled: "Restock sent to Dufil · 80 cartons",
    step: "Counting Indomie Chicken in the warehouse",
    costToday: 17,
    steps: 8,
  },
  Brand: {
    base: "blocked",
    outcome: "Hypo report drafted · Gmail needs reconnecting",
    settled: "Hypo report sent · next one Monday",
    step: "Blocked: Gmail access expired, can't send the Hypo email",
    costToday: 9,
    steps: 6,
  },
  Proof: {
    base: "waiting",
    outcome: "Matched ₦87,000 · caught 1 fake alert",
    settled: "All alerts checked · 1 fake held",
    step: "Checking GTBank for Joy Supermarket's POS payment",
    costToday: 64,
    steps: 27,
  },
};

export const rosterNames: readonly RosterName[] = ["Mimi", "Order", "Collector", "Credit", "Stock", "Brand", "Proof"];

export type RosterRow = {
  name: RosterName;
  state: FaceState;
  /** Items waiting on the owner (orange dot when > 0). */
  needs: number;
  preview: string;
  step: string;
  ago: string;
  costToday: number;
  steps: number;
  /** Where the row opens: the newest thread that needs the owner, else the newest thread. */
  thread?: Conversation;
};

const needsIn = (c: Conversation) => c.messages.filter((m) => m.kind === "card" && m.card.status === "needs").length;

/** True while a helper is mid-run in this thread (typing, a live thought or a running step). */
export function runningIn(s: Pick<DemoState, "typing">, c: Conversation): boolean {
  if (s.typing?.slug === c.slug && s.typing.who !== "me") return true;
  return c.messages.some((m) => (m.kind === "thought" && m.live) || (m.kind === "step" && m.state === "run"));
}

/** One roster row, derived from the demo store so faces follow the work. */
export function rosterRow(s: Pick<DemoState, "conversations" | "typing" | "computer">, name: RosterName): RosterRow {
  const seed = rosterSeed[name];
  const mine = s.conversations.filter((c) => c.helper === name);
  const total = s.conversations.reduce((n, c) => n + needsIn(c), 0);
  /* Mimi carries the whole team's count (the sidebar has no Needs you row); helpers carry their own */
  const needs = name === "Mimi" ? total : mine.reduce((n, c) => n + needsIn(c), 0);
  const live = mine.find((c) => runningIn(s, c));
  let state: FaceState = seed.base;
  let step = seed.step;
  let preview = seed.outcome;
  if (live) {
    state = "working";
    step = `${live.status.charAt(0).toUpperCase()}${live.status.slice(1)} · ${live.title}`;
  } else if (seed.base === "waiting" && needs === 0) {
    state = "done";
    step = "Finished · nothing waiting on you";
    preview = seed.settled;
  } else if (seed.base === "blocked" && needs === 0) {
    preview = seed.settled;
  }
  if (name === "Mimi") preview = total ? `${total} things need you · team on track` : seed.settled;
  if (name === "Proof" && !live && s.computer.helper === "Proof" && (s.computer.status === "live" || s.computer.status === "user")) {
    state = s.computer.status === "user" ? "waiting" : "working";
    step = s.computer.status === "user" ? "You have her computer · she resumes when you're done" : `Computer · ${s.computer.activity}`;
  }
  const thread = mine.find((c) => needsIn(c) > 0) ?? mine[0];
  return { name, state, needs, preview, step, ago: thread?.ago ?? "", costToday: seed.costToday, steps: seed.steps, thread };
}

/** Minutes behind now for a sidebar age ("2m", "3h", "1d", "1w"); new threads ("now", a clock) are 0. */
export function ageMinutes(ago: string): number {
  const m = /^(\d+)\s*([mhdw])$/.exec(ago.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  return n * { m: 1, h: 60, d: 1440, w: 10080 }[m[2] as "m" | "h" | "d" | "w"];
}

/** A day label for a task that has no date line of its own. */
export function dayLabel(ago: string): string {
  const min = ageMinutes(ago);
  if (min < 1440) return "Today";
  if (min < 2880) return "Yesterday";
  if (min < 10080) return `${Math.round(min / 1440)} days ago`;
  return "Last week";
}

/**
 * A helper's one conversation (iMessage / Grok Bot): every task she has worked on, oldest first,
 * with the open task (`activeSlug`) last so it sits right above the composer.
 */
export function helperSections(
  conversations: Conversation[],
  helper: RosterName,
  activeSlug?: string,
): Conversation[] {
  const mine = conversations.map((c, i) => ({ c, i })).filter((x) => x.c.helper === helper);
  mine.sort((a, b) => {
    if (a.c.slug === activeSlug) return 1;
    if (b.c.slug === activeSlug) return -1;
    return ageMinutes(b.c.ago) - ageMinutes(a.c.ago) || b.i - a.i;
  });
  return mine.map((x) => x.c);
}

/** Where a helper's conversation opens: the newest task that needs the owner, else the newest task. */
export function helperEntry(conversations: Conversation[], helper: RosterName): Conversation | undefined {
  const mine = conversations.filter((c) => c.helper === helper);
  return mine.find((c) => needsIn(c) > 0) ?? mine[0];
}
