import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { JsonLd } from "@/components/ui/JsonLd";
import { LegalPage } from "@/features/marketing/components/LegalPage";
import { privacy } from "@/features/marketing/content/legal-privacy";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "How Mimi collects, uses and protects data, under the Nigeria Data Protection Act. Draft for review.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <RouteView route="privacy">
      <JsonLd data={breadcrumbJsonLd([{ name: "Privacy", path: "/privacy" }])} />
      <LegalPage
        doc={privacy}
        asideSticker={{
          src: "sticker-phone",
          pos: "br",
          w: 110,
          r: "-8deg",
          ox: "4%",
          oy: "40px",
          lazy: true,
        }}
      />
    </RouteView>
  );
}
