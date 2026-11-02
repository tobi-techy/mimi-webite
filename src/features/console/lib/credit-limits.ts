"use client";

import { useSyncExternalStore } from "react";

/**
 * Credit limits the owner sets from the console. Mimi never moves money and never sets a limit:
 * the distributor decides, Credit only suggests. The API has no endpoint that writes a limit
 * (only GET /v1/credit), so a limit set here lives in this tab (sample data and the live demo
 * alike) and every screen that shows a limit reads it through `limitOf`. An approved Credit
 * request is also approved on the API (POST /v1/approvals/{id}/approve), which records the
 * owner's yes; the limit figure itself still comes from GET /v1/credit.
 */

export type LimitTarget = {
  shopId: string;
  name: string;
  area: string;
  /** The limit now, in naira. */
  current: number;
  /** What the shop owes now and how much of it is overdue (naira), when known. */
  owed?: number;
  overdue?: number;
  /** One plain line on how the shop pays ("Paid on time 9 of last 12"). */
  record: string;
  /** Credit's suggestion and its one plain reason. */
  suggestion?: { to: number; why: string; approvalId?: string };
  /** Opens on this amount (approving a suggestion). */
  prefill?: number;
  /** A Credit card in a chat that this decides (approving it runs this same flow). */
  card?: { slug: string; messageId: string };
};

export type LimitChange = { limit: number; prev: number; at: number; by: string; review?: string; told: boolean };

type State = {
  open: LimitTarget | null;
  /** The newest change per shop. */
  set: Readonly<Record<string, LimitChange>>;
  /** Each shop's history lines, newest first ("Limit set by Emeka Obi · 21:40"). */
  history: Readonly<Record<string, { text: string; at: number }[]>>;
};

let state: State = { open: null, set: {}, history: {} };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const update = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

export const getLimits = () => state;
export function useLimits<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => pick(state),
    () => pick(state),
  );
}

export const openLimitSheet = (t: LimitTarget) => update({ open: t });
export const closeLimitSheet = () => update({ open: null });

/** The limit a screen shows: the owner's newest change from this tab, else the book's figure. */
export const limitOf = (shopId: string, book: number): number => state.set[shopId]?.limit ?? book;

const hhmm = (at: number) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const historyLine = (by: string, at: number) => `Limit set by ${by} · ${hhmm(at)}`;

export function saveLimit(shopId: string, change: LimitChange): void {
  const lines = state.history[shopId] ?? [];
  update({
    set: { ...state.set, [shopId]: change },
    history: { ...state.history, [shopId]: [{ text: `${historyLine(change.by, change.at)} · ₦${change.prev.toLocaleString("en-US")} → ₦${change.limit.toLocaleString("en-US")}`, at: change.at }, ...lines] },
  });
}

/** Undo the newest change (shortly after setting it): the limit goes back and its history line goes. */
export function undoLimit(shopId: string): void {
  const { [shopId]: _gone, ...rest } = state.set;
  void _gone;
  const lines = (state.history[shopId] ?? []).slice(1);
  update({ set: rest, history: { ...state.history, [shopId]: lines } });
}

/* ---------- pure helpers (amounts in naira) ---------- */

/** "₦1,500,000" while typing: digits only, grouped. Empty stays empty. */
export function formatAmount(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
  return digits ? Number(digits).toLocaleString("en-US") : "";
}
export const parseAmount = (shown: string): number => Number(shown.replace(/\D/g, "") || 0);

/** Quick picks: keep the limit, Credit's suggestion, and a few round steps around the limit. */
export function quickPicks(current: number, suggestion?: number): { label: string; value: number }[] {
  const step = current >= 1_000_000 ? 250_000 : current >= 200_000 ? 100_000 : 50_000;
  const round = (n: number) => Math.round(n / step) * step;
  const out: { label: string; value: number }[] = [{ label: "Keep", value: current }];
  if (suggestion && suggestion !== current) out.push({ label: "Credit's", value: suggestion });
  for (const v of [round(current) - step, round(current) + step, round(current) + 2 * step]) {
    if (v > 0 && !out.some((o) => o.value === v)) out.push({ label: "", value: v });
  }
  return out.slice(0, 5);
}
