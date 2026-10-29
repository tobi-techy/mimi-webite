"use client";

import { useCreditKpis } from "@/features/console/api/hooks";
import { SkeletonNum } from "@/features/console/components/live/Skeleton";

const LOADING = ["Outstanding", "Overdue", "Credit limits", "Shops"];

/** The four tiles on Credit (sample figures, or totals from the API). */
export function CreditKpis() {
  const kpis = useCreditKpis();
  return (
    <div className="x-kpis">
      {(kpis ?? LOADING.map((label) => ({ label, value: null }))).map((k) => (
        <div key={k.label} className="x-kpi">
          <b>{k.value ?? <SkeletonNum />}</b>
          <span>{k.label}</span>
        </div>
      ))}
    </div>
  );
}
