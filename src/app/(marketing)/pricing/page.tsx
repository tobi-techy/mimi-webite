import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { PricingCalculator } from "@/features/marketing/sections/pricing/PricingCalculator";
import { PricingIntro } from "@/features/marketing/sections/pricing/PricingIntro";
import { PricingPilot } from "@/features/marketing/sections/pricing/PricingPilot";
import { PricingPlans } from "@/features/marketing/sections/pricing/PricingPlans";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Pricing for distributors, free for shops",
  description:
    "Pilot pricing from ₦2,000 per active shop a month, to be confirmed with pilot distributors. Shops always use Mimi free. Work out what Mimi could save your routes.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <RouteView route="pricing">
      <JsonLd data={breadcrumbJsonLd([{ name: "Pricing", path: "/pricing" }])} />
      <PricingIntro />
      <PricingPlans />
      <PricingCalculator />
      <PricingPilot />
    </RouteView>
  );
}
