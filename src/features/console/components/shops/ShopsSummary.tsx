"use client";

import { useShopsSummary } from "@/features/console/api/hooks";
import { SkeletonNum } from "@/features/console/components/live/Skeleton";

/** The line under the Shops title (sample figures, or totals from the API). */
export function ShopsSummary() {
  const line = useShopsSummary();
  return <p className="x-sub">{line ?? <SkeletonNum />}</p>;
}
