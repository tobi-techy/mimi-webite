"use client";

import { useSearchParams } from "next/navigation";
import { useShop } from "@/features/console/api/hooks";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { ShopDetail } from "@/features/console/components/shops/ShopDetail";
import { ShopDrawer } from "@/features/console/components/shops/ShopDrawer";

/** A shop from the API in the drawer (/shops/live?id=…): the list row first, then its full detail. */
export function LiveShopRoute() {
  const id = useSearchParams().get("id") ?? "";
  const { shop, loading } = useShop(id);
  if (shop) return <ShopDetail shop={shop} />;
  return (
    <ShopDrawer titleId="shop-title" head={<h2 id="shop-title">{loading ? "Opening shop" : "Shop not found"}</h2>}>
      {loading ? <SkeletonRows count={4} /> : <p className="x-of">This shop isn&apos;t in your demo copy.</p>}
    </ShopDrawer>
  );
}
