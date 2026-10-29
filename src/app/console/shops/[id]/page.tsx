import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LiveShopRoute } from "@/features/console/components/shops/LiveShopRoute";
import { ShopDetail } from "@/features/console/components/shops/ShopDetail";
import { findShop, shops } from "@/features/console/content/shops";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  /* "live": shops from the API open at /shops/live?id=… (static-export safe) */
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
  const shop = findShop(id);
  if (!shop) notFound();
  return <ShopDetail shop={shop} />;
}
