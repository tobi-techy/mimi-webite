import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USES_API } from "@/features/console/api/config";
import { ShopListView } from "@/features/console/components/lists/ShopListView";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { findShopList, shopLists } from "@/features/console/content/shop-lists";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return shopLists.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (USES_API) return { title: "Shop lists" };
  return { title: findShopList((await params).id)?.name ?? "Shop list" };
}

/** One shop list: the message that went out, how it landed, and every shop's private reply. */
export default async function ShopListPage({ params }: Props) {
  if (USES_API) return <NotAvailable title="Shop lists" />;
  const list = findShopList((await params).id);
  if (!list) notFound();
  return (
    <ConsoleView label={list.name} className="x-view--list">
      <ShopListView id={list.id} />
    </ConsoleView>
  );
}
