import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USES_API } from "@/features/console/api/config";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";

export const metadata: Metadata = { title: "Shop lists" };

/**
 * The shop-lists index: shop lists are a list of one message per shop, opened from the sidebar, so
 * there is no index screen. Landing here shows the honest note in the API build (and the console
 * 404 in the sample build) rather than falling through to a static host's directory listing.
 */
export default function ShopListsIndexPage() {
  if (USES_API) return <NotAvailable title="Shop lists" />;
  notFound();
}
