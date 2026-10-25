import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopDetail } from "@/features/console/components/shops/ShopDetail";
import { findShop, shops } from "@/features/console/content/shops";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return shops.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: findShop((await params).id)?.name ?? "Shop" };
}

export default async function ShopPage({ params }: Props) {
  const shop = findShop((await params).id);
  if (!shop) notFound();
  return <ShopDetail shop={shop} />;
}
