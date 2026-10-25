import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { JsonLd } from "@/components/ui/JsonLd";
import { LegalPage } from "@/features/marketing/components/LegalPage";
import { terms } from "@/features/marketing/content/legal-terms";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms",
  description: "Terms of use for Mimi, by Rail Technology Concepts Ltd. Draft for review.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <RouteView route="terms">
      <JsonLd data={breadcrumbJsonLd([{ name: "Terms", path: "/terms" }])} />
      <LegalPage
        doc={terms}
        asideSticker={{
          src: "sticker-receipt",
          pos: "br",
          w: 110,
          r: "8deg",
          ox: "4%",
          oy: "40px",
          lazy: true,
        }}
      />
    </RouteView>
  );
}
