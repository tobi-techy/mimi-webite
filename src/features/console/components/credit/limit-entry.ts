"use client";

import { getLive } from "@/features/console/api/live-store";
import { creditLines, creditRecommendations, type CreditLine, type CreditRecommendation } from "@/features/console/content/credit";
import { USES_API } from "@/features/console/api/config";
import { shops as sampleShops, type Shop } from "@/features/console/content/shops";
import { approveCard } from "@/features/console/demo/engine";
import type { Message } from "@/features/console/demo/types";
import { limitOf, openLimitSheet, type LimitTarget } from "@/features/console/lib/credit-limits";

/**
 * Every way into Set credit limit builds the same target: the Credit page row, the shop record,
 * a Credit suggestion (on the Credit page or as a card in Credit's chat). Figures come from the
 * book the screen already shows (the API's in the live demo, the sample's otherwise); nothing is
 * made up for an API shop.
 */

/** How a shop pays, in one plain line. */
export function payRecord(shop: Shop): string {
  if (shop.live) {
    const r = shop.live.receivables;
    if (r?.length) {
      const late = r.filter((x) => x.daysOverdue > 0);
      if (!late.length) return `${r.length} open bills, none late`;
      const worst = Math.max(...late.map((x) => x.daysOverdue));
      return `${late.length} of ${r.length} open bills late, oldest ${worst} days`;
    }
    return shop.live.openInvoices ? `${shop.live.openInvoices} open bills` : "No open bills";
  }
  /* sample shops: their payment score read as the last 12 bills */
  const onTime = Math.max(0, Math.min(12, Math.round((shop.score / 100) * 12)));
  return `Paid on time ${onTime} of last 12`;
}

const parseRec = (line?: CreditLine): number | undefined => {
  const m = /(?:Raise|Lower) to ₦([\d,]+)/.exec(line?.recommendation ?? "");
  return m ? Number(m[1]!.replace(/,/g, "")) : undefined;
};

function book(): { lines: readonly CreditLine[]; recs: readonly CreditRecommendation[]; shops: readonly Shop[] } {
  const l = getLive();
  if (l.status === "ready" && l.creditLines && l.creditRecs) return { lines: l.creditLines, recs: l.creditRecs, shops: l.shops ?? [] };
  if (USES_API) return { lines: l.creditLines ?? [], recs: l.creditRecs ?? [], shops: l.shops ?? [] };
  return { lines: creditLines, recs: creditRecommendations, shops: sampleShops };
}

/** The sheet's target for one shop (its limit, what it owes, how it pays, Credit's suggestion). */
export function limitTarget(shop: Shop, opts: { line?: CreditLine; rec?: CreditRecommendation; prefill?: number } = {}): LimitTarget {
  const b = book();
  const full = getLive().shopDetails[shop.id] ?? shop;
  const line = opts.line ?? b.lines.find((l) => l.shop.id === shop.id);
  const rec = opts.rec ?? b.recs.find((r) => r.shopId === shop.id);
  /* a sample shop with no credit line yet: its limit is half again what it owes (the old demo control) */
  const bookLimit = full.live?.creditLimit ?? line?.limit ?? Math.max(50000, Math.ceil((full.owed * 1.5) / 10000) * 10000);
  const suggested = rec?.to ?? parseRec(line);
  const why = rec?.why ?? (suggested ? "Credit's monthly review" : "");
  return {
    shopId: shop.id,
    name: full.name,
    area: full.area,
    current: limitOf(shop.id, bookLimit),
    owed: full.owed,
    overdue: full.live ? full.live.overdue : full.status === "o" ? full.owed : 0,
    record: payRecord(full),
    suggestion: suggested ? { to: suggested, why, approvalId: rec?.approvalId } : undefined,
    prefill: opts.prefill,
  };
}

export const openLimitFor = (shop: Shop, opts?: { line?: CreditLine; rec?: CreditRecommendation; prefill?: number }) => openLimitSheet(limitTarget(shop, opts));

/** A Credit card in a chat ("New limit · Iya Femi Provisions", ₦100,000 → ₦150,000): approving it runs the same flow, prefilled. */
export function openLimitForCard(slug: string, m: Extract<Message, { kind: "card" }>): void {
  const c = m.card;
  const name = c.shop ?? c.title.replace(/^.*·\s*/, "");
  const shop = book().shops.find((s) => s.name === name);
  const from = /₦([\d,]+)\s*→/.exec(c.sub);
  const current = from ? Number(from[1]!.replace(/,/g, "")) : undefined;
  const why = c.why ?? c.rows[0]?.note ?? "";
  if (shop) {
    const t = limitTarget(shop, { prefill: c.amount });
    openLimitSheet({ ...t, current: current ?? t.current, suggestion: c.amount ? { to: c.amount, why } : t.suggestion, card: { slug, messageId: m.id } });
    return;
  }
  const paid = c.rows.find((r) => /on time/i.test(r.label));
  openLimitSheet({
    shopId: `card:${name}`,
    name,
    area: "",
    current: limitOf(`card:${name}`, current ?? 0),
    record: paid?.note ? `Paid on time ${paid.note}` : "—",
    suggestion: c.amount ? { to: c.amount, why } : undefined,
    prefill: c.amount,
    card: { slug, messageId: m.id },
  });
}

/** Approve a card: a credit limit goes through the Set credit limit sheet, anything else as before. */
export function decideCard(slug: string, m: Extract<Message, { kind: "card" }>): void {
  if (m.card.kind === "credit") return openLimitForCard(slug, m);
  approveCard(slug, m.id);
}
