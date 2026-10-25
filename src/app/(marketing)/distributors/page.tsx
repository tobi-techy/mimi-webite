import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { FaqSection } from "@/features/marketing/sections/FaqSection";
import { WorksWith } from "@/features/marketing/sections/WorksWith";
import { DistributorsAgents } from "@/features/marketing/sections/distributors/DistributorsAgents";
import { DistributorsCta } from "@/features/marketing/sections/distributors/DistributorsCta";
import { DistributorsGrow } from "@/features/marketing/sections/distributors/DistributorsGrow";
import { DistributorsHero } from "@/features/marketing/sections/distributors/DistributorsHero";
import { DistributorsOutcomes } from "@/features/marketing/sections/distributors/DistributorsOutcomes";
import { DistributorsPayments } from "@/features/marketing/sections/distributors/DistributorsPayments";
import { DistributorsPilot } from "@/features/marketing/sections/distributors/DistributorsPilot";
import { JsonLd } from "@/components/ui/JsonLd";
import { Sticker } from "@/components/ui/Sticker";
import { distributorsFaq } from "@/features/marketing/content/faq";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Distributors",
  description:
    "Mimi runs on WhatsApp. It reminds shops what they owe, confirms every transfer with the bank, and checks each van against what shops say they received.",
  path: "/distributors",
});

export default function DistributorsPage() {
  return (
    <RouteView route="distributors">
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Distributors", path: "/distributors" }]),
          faqJsonLd(distributorsFaq),
        ]}
      />
      <DistributorsHero />
      <DistributorsOutcomes />
      <DistributorsGrow />
      <DistributorsAgents />
      <DistributorsPayments />
      <WorksWith />
      <DistributorsPilot />
      <FaqSection
        cream
        items={distributorsFaq}
        note="Ask away."
        stickers={
          <>
            <Sticker src="sticker-phone" pos="tr" w={100} r="12deg" ox="8%" lazy />{" "}
            <Sticker src="sticker-oil" pos="bl" w={110} r="-9deg" ox="18%" lazy />{" "}
          </>
        }
      />
      <DistributorsCta />
    </RouteView>
  );
}
