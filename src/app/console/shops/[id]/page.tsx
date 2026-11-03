import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { USES_API } from "@/features/console/api/config";
import { LiveShopRoute } from "@/features/console/components/shops/LiveShopRoute";
import { ShopDetail } from "@/features/console/components/shops/ShopDetail";
import { findShop, shops } from "@/features/console/content/shops";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  /* "live": shops from the API open at /shops/live?id=… (static-export safe). The sample shops
   * are not pages in the API build: their routes would show sample data. */
  if (USES_API) return [{ id: "live" }];
  return [...shops.map((s) => ({ id: s.id })), { id: "live" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  return { title: id === "live" ? "Shop" : (findShop(id)?.name ?? "Shop") };
}

export default async function ShopPage({ params }: Props) {
  const id = (await params).id;
  if (id === "live")
    return (
      <Suspense fallback={null}>
        <LiveShopRoute />
      </Suspense>
    );
  if (USES_API) notFound();
  const shop = findShop(id);
  if (!shop) notFound();
  return <ShopDetail shop={shop} />;
}
