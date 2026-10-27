import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { FaqSection } from "@/features/marketing/sections/FaqSection";
import { ShopsHero } from "@/features/marketing/sections/shops/ShopsHero";
import { ShopsJobs } from "@/features/marketing/sections/shops/ShopsJobs";
import { ShopsRules } from "@/features/marketing/sections/shops/ShopsRules";
import { ShopsVoice } from "@/features/marketing/sections/shops/ShopsVoice";
import { JsonLd } from "@/components/ui/JsonLd";
import { Sticker } from "@/components/ui/Sticker";
import { shopsFaq } from "@/features/marketing/content/faq";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Free shop debt book on WhatsApp",
  description:
    "A free shop book on WhatsApp for Nigerian shop owners. Remember who owes you, keep your stock book from a photo and reorder from your distributor in one tap. No app to download.",
  path: "/shops",
});

export default function ShopsPage() {
  return (
    <RouteView route="shops" className="x-shops" id="shopsView">
      <JsonLd data={[breadcrumbJsonLd([{ name: "Shops", path: "/shops" }]), faqJsonLd(shopsFaq)]} />
      <ShopsHero />
      <ShopsJobs />
      <ShopsRules />
      <ShopsVoice />
      <FaqSection
        items={shopsFaq}
        stickers={
          <>
            <Sticker src="sticker-sugar" pos="tr" w={120} r="10deg" ox="6%" oy="-50px" lazy />{" "}
            <Sticker src="sticker-keke" pos="bl" w={130} r="-8deg" ox="14%" lazy />{" "}
          </>
        }
      />
    </RouteView>
  );
}
