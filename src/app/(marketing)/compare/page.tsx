import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { CompareHub } from "@/features/marketing/sections/compare/CompareHub";
import { JsonLd } from "@/components/ui/JsonLd";
import { compareFaq } from "@/features/marketing/content/compare";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Mimi vs the tools distributors use",
  description:
    "An honest, cited comparison of Mimi with F6C Distro, DistroOS, ZöTok and the notebook, WhatsApp and Excel way. Real prices, real strengths, checked 24 Oct 2026.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <RouteView route="compare">
      <JsonLd data={[breadcrumbJsonLd([{ name: "Compare", path: "/compare" }]), faqJsonLd(compareFaq)]} />
      <CompareHub />
    </RouteView>
  );
}
