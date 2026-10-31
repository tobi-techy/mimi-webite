import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopListView } from "@/features/console/components/lists/ShopListView";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { findShopList, shopLists } from "@/features/console/content/shop-lists";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return shopLists.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: findShopList((await params).id)?.name ?? "Shop list" };
}

/** One shop list: the message that went out, how it landed, and every shop's private reply. */
export default async function ShopListPage({ params }: Props) {
  const list = findShopList((await params).id);
  if (!list) notFound();
  return (
    <ConsoleView label={list.name} className="x-view--list">
      <ShopListView id={list.id} />
    </ConsoleView>
  );
}
