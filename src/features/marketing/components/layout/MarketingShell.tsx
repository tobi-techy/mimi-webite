import type { ReactNode } from "react";
import { Footer } from "@/features/marketing/components/layout/Footer";
import { Loader } from "@/features/marketing/components/layout/Loader";
import { SiteFrame } from "@/features/marketing/components/layout/SiteFrame";
import { WhatsAppButton } from "@/features/marketing/components/layout/WhatsAppButton";
import { JsonLd } from "@/components/ui/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "@/features/marketing/styles/index.css";

/** The marketing site chrome: loader, nav, footer and site-wide JSON-LD around a page. */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Loader />
      <SiteFrame footer={<Footer />} whatsapp={<WhatsAppButton />}>
        {children}
      </SiteFrame>
    </>
  );
}
