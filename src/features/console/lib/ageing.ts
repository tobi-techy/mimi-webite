import type { Shop } from "@/features/console/content/shops";
/* a plain import, not the "@/…" alias: node --test imports this file to check the arithmetic */
import { naira } from "./format.ts";

/**
 * TEMPORARY, and the one place to change.
 *
 * The API owns what "owed" and "overdue" mean (MIMI-AGENT `mimi/owed.py`: an open invoice past its
 * due date, the book's `days_overdue` above zero), and the morning brief, GET /v1/shops and the
 * tools all take their sums from there so that no two surfaces disagree.
 *
 * Until the exposure endpoint lands, this file buckets each shop's overdue money by its oldest
 * unpaid invoice, using the API's own `overdue_days` field, and reads the two totals the API sends
 * on GET /v1/shops. When the endpoint lands, render its buckets and delete this file: the console
 * must not keep a second opinion about ageing.
 */
export const AGEING_BANDS = [
  { id: "d1_30", label: "1 to 30 days", to: 30 },
  { id: "d31_60", label: "31 to 60 days", to: 60 },
  { id: "d61_90", label: "61 to 90 days", to: 90 },
  { id: "d90", label: "Over 90 days", to: Number.POSITIVE_INFINITY },
] as const;

export type AgeingBandId = (typeof AGEING_BANDS)[number]["id"];

export type AgeingRow = { id: AgeingBandId; label: string; money: number; shops: number };

export type Ageing = {
  /** Everything the book is owed. */
  owed: number;
  /** The part past its due date. */
  overdue: number;
  /** Shops with anything past due. */
  debtors: number;
  /** Days on the oldest unpaid invoice across the book. */
  oldest: number;
  /**
   * Past-due money the book sends with no day count. It is counted here, never bucketed: a nought
   * would file it under "1 to 30 days" and the screen would call young money young without a fact.
   */
  undated: number;
  /** Overdue money by age, one row per band. */
  bands: AgeingRow[];
};

/** The band a shop's oldest unpaid invoice falls in. */
export function bandOf(days: number): AgeingBandId {
  const d = Math.max(0, Math.floor(days));
  for (const b of AGEING_BANDS) if (d <= b.to) return b.id;
  return "d90";
}

/**
 * The book's money at risk. `totals` are the API's own sums (GET /v1/shops sends `owed_total_kobo`
 * and `overdue_total_kobo`); only when it does not send them are the rows added up here, so the
 * figure stays the API's definition either way.
 */
export function ageingOf(
  shops: readonly Shop[],
  totals: { owed?: number; overdue?: number } | null = null,
): Ageing {
  const money = new Map<AgeingBandId, { money: number; shops: number }>(
    AGEING_BANDS.map((b) => [b.id, { money: 0, shops: 0 }]),
  );
  let owed = 0;
  let overdue = 0;
  let debtors = 0;
  let oldest = 0;
  let undated = 0;

  for (const s of shops) {
    owed += s.owed;
    const late = s.live?.overdue ?? 0;
    if (late <= 0) continue;
    overdue += late;
    debtors += 1;
    const days = s.live?.overdueDays;
    if (days === undefined) {
      /* the book sent money but no age: hold it aside rather than call it 1 to 30 days old */
      undated += late;
      continue;
    }
    const age = Math.max(0, Math.floor(days));
    oldest = Math.max(oldest, age);
    const row = money.get(bandOf(age))!;
    row.money += late;
    row.shops += 1;
  }

  return {
    owed: totals?.owed ?? owed,
    overdue: totals?.overdue ?? overdue,
    debtors,
    oldest,
    undated,
    bands: AGEING_BANDS.map((b) => ({ id: b.id, label: b.label, ...money.get(b.id)! })),
  };
}

/** Why a shop sits where it does, in plain words, from what the API says about it. */
export function reasonOf(s: Shop): string {
  const days = Math.max(0, s.live?.overdueDays ?? 0);
  const open = s.live?.openInvoices ?? 0;
  const limit = s.live?.creditLimit ?? 0;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"} past due`);
  if (open > 0) parts.push(`${open} unpaid ${open === 1 ? "invoice" : "invoices"}`);
  if (limit > 0 && s.owed > limit) parts.push(`over its ${naira(limit)} limit`);
  return parts.join(", ");
}
