"use client";

import { useCreditKpis, useUnreachable } from "@/features/console/api/hooks";
import { SkeletonNum } from "@/features/console/components/live/Skeleton";

const LOADING = ["Outstanding", "Overdue", "Credit limits", "Shops"];

/** The four tiles on Credit (sample figures, or totals from the API). */
export function CreditKpis() {
  const kpis = useCreditKpis();
  const unreachable = useUnreachable();
  /* an unread book shows no tiles: skeletons would read as "still loading" until the heat death */
  if (unreachable) return null;
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
