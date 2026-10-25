import { shops, type Shop } from "@/features/console/content/shops";

export type CreditLine = { shop: Shop; limit: number; due: string; late: boolean; recommendation: string };
export type CreditRecommendation = { shopId: string; to: number; verb: "Raise" | "Lower"; why: string };

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

export const creditKpis = [
  { value: "₦4.82m", label: "Outstanding" },
  { value: "₦1.1m", label: "Overdue" },
  { value: "92%", label: "Repaid on time" },
  { value: "38", label: "Shops eligible" },
] as const;
