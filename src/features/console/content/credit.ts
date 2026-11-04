import { shops, type Shop } from "@/features/console/content/shops";

export type CreditLine = { shop: Shop; limit: number; due: string; late: boolean; recommendation: string };
export type CreditRecommendation = {
  shopId: string;
  to: number;
  verb: "Raise" | "Lower";
  why: string;
  /** API credit requests: the approval that accepting or dismissing decides. */
  approvalId?: string;
};

const byIndex = (i: number): Shop => {
  const s = shops[i];
  if (!s) throw new Error(`No sample shop at ${i}`);
  return s;
};

export const creditLines: readonly CreditLine[] = (
  [
    [9, 300000, "Oct 26", false, "Raise to ₦400,000"],
    [0, 250000, "Oct 14", true, "Hold"],
    [1, 500000, "Sep 30", true, "Lower to ₦350,000"],
    [11, 300000, "Sep 27", true, "Lower to ₦150,000"],
    [3, 200000, "Oct 30", false, "Raise to ₦300,000"],
    [6, 200000, "Oct 25", false, "Hold"],
    [8, 600000, "Oct 22", false, "Hold"],
    [10, 250000, "Oct 20", false, "Hold"],
  ] as const
).map(([i, limit, due, late, recommendation]) => ({ shop: byIndex(i), limit, due, late, recommendation }));

export const creditRecommendations: readonly CreditRecommendation[] = [
  { shopId: "kola-mart", to: 400000, verb: "Raise", why: "Score 88, pays in 5 days, sell-through 91%" },
  { shopId: "joy-provisions", to: 150000, verb: "Lower", why: "Last paid Sep 20, sell-through down to 47%" },
  {
    shopId: "iya-tunde-stores",
    to: 300000,
    verb: "Raise",
    why: "Score 85, paid ₦58,200 today, using 29% of limit",
  },
];

/* the tiles are added up from the sample book itself (12 shops in content/shops.ts): no invented figures */
const sampleOwed = shops.reduce((t, s) => t + s.owed, 0);
const sampleLate = shops.filter((s) => s.status === "o");
const sampleOverdue = sampleLate.reduce((t, s) => t + s.owed, 0);
const sampleLimits = creditLines.reduce((t, l) => t + l.limit, 0);
const sampleInLines = creditLines.reduce((t, l) => t + l.shop.owed, 0);
const money = (n: number) => `₦${n.toLocaleString("en-US")}`;
const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;
export const creditKpis = [
  { value: money(sampleOwed), label: "Outstanding", note: `across ${shops.length} shops` },
  { value: money(sampleOverdue), label: "Overdue", note: `${pct(sampleOverdue, sampleOwed)} of outstanding` },
  { value: money(sampleLimits), label: "Credit limits", note: `${pct(sampleInLines, sampleLimits)} in use` },
  { value: String(shops.length), label: "Shops", note: `${sampleLate.length} overdue` },
] as const;
