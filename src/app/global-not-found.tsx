import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/layout/RootDocument";
import { MarketingShell } from "@/features/marketing/components/layout/MarketingShell";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { NotFoundSection } from "@/features/marketing/sections/not-found/NotFoundSection";
import { siteIcons, siteViewport } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page not found · Mimi",
  robots: { index: false, follow: true },
  icons: siteIcons,
};

export const viewport: Viewport = siteViewport;

/** Global 404 for unmatched URLs. It renders its own document, outside the root layout. */
export default function GlobalNotFound() {
  return (
    <RootDocument>
      <MarketingShell>
        <RouteView route="404">
          <NotFoundSection />
        </RouteView>
      </MarketingShell>
    </RootDocument>
  );
}
