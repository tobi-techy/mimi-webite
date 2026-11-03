/**
 * Pure figures for the live demo tour (no browser, no network), so they can be unit tested.
 *
 * - `demoPhone`: the demo book's synthetic shop numbers, rebuilt from the last four digits the API
 *   shows (demo copy only; a real book never exposes a full number).
 * - `suggestLimit`: Credit's suggested limit and reasons for an order over its limit, worked out
 *   the same way as the API's code path (MIMI-AGENT `demo_wiring.suggest_limit`).
 */
/* same as lib/format.ts `naira`, kept here so the file has no runtime imports (node:test) */
const naira = (n: number): string => `₦${Math.round(n).toLocaleString("en-US")}`;

/** The demo book's synthetic numbers are +234000000 followed by the last four digits. */
export const DEMO_PHONE_PREFIX = "+234000000";

export function demoPhone(last4: string | undefined | null): string | null {
  const d = (last4 ?? "").replace(/\D/g, "");
  return d.length === 4 ? `${DEMO_PHONE_PREFIX}${d}` : null;
}

export type BookPayment = { paid_on: string; amount_ngn: number; verified: boolean };

const STEP = 50_000;
const WINDOW_DAYS = 90;

/** A limit that covers the order, rounded up to ₦50,000, and four plain reasons from the book. */
export function suggestLimit(o: {
  limit: number;
  owed: number;
  order: number;
  overdue: number;
  overdueDays: number;
  payments: readonly BookPayment[];
}): { suggested: number; reasons: string[] } {
  const need = o.owed + o.order;
  const suggested = Math.max(o.limit, Math.ceil(need / STEP) * STEP);
  const newest = o.payments.reduce((t, p) => (p.paid_on > t ? p.paid_on : t), "");
  const since = newest ? new Date(Date.parse(newest) - WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10) : "";
  const recent = o.payments.filter((p) => p.paid_on >= since);
  const reasons = [`Owes ${naira(o.owed)} now. This order takes it to ${naira(need)}, ${naira(Math.max(0, need - o.limit))} over its ${naira(o.limit)} limit.`];
  if (recent.length) {
    const ok = recent.filter((p) => p.verified).length;
    reasons.push(`${ok} of ${recent.length} payments in the last ${WINDOW_DAYS} days were confirmed by the bank.`);
    reasons.push(`Paid ${naira(recent.reduce((n, p) => n + p.amount_ngn, 0))} in the last ${WINDOW_DAYS} days.`);
  } else reasons.push(`No payments in the last ${WINDOW_DAYS} days.`);
  reasons.push(o.overdue > 0 ? `${naira(o.overdue)} is overdue, oldest ${o.overdueDays} days late.` : "Nothing is overdue.");
  return { suggested, reasons };
}

/** The order the tour places for a shop: a small restock when it is already over its limit. */
export function tourOrder(owed: number, limit: number): number {
  if (owed >= limit) return 25_000;
  return Math.max(25_000, Math.ceil((limit - owed + 25_000) / 5_000) * 5_000);
}
