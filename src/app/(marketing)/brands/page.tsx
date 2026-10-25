import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { FaqSection } from "@/features/marketing/sections/FaqSection";
import { BrandsAgents } from "@/features/marketing/sections/brands/BrandsAgents";
import { BrandsCta } from "@/features/marketing/sections/brands/BrandsCta";
import { BrandsHero } from "@/features/marketing/sections/brands/BrandsHero";
import { BrandsProblem } from "@/features/marketing/sections/brands/BrandsProblem";
import { BrandsSponsor } from "@/features/marketing/sections/brands/BrandsSponsor";
import { JsonLd } from "@/components/ui/JsonLd";
import { Sticker } from "@/components/ui/Sticker";
import { brandsFaq } from "@/features/marketing/content/faq";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Brands",
  description:
    "Mimi turns consented shop books across your distributors into weekly sell-through, promo proof and claims you can trust.",
  path: "/brands",
});

export default function BrandsPage() {
  return (
    <RouteView route="brands">
      <JsonLd data={[breadcrumbJsonLd([{ name: "Brands", path: "/brands" }]), faqJsonLd(brandsFaq)]} />
      <BrandsHero />
      <BrandsProblem />
      <BrandsAgents />
      <BrandsSponsor />
      <FaqSection
        items={brandsFaq}
        stickers={
          <>
            <Sticker src="sticker-cash" pos="tr" w={130} r="10deg" ox="6%" oy="-40px" lazy />{" "}
            <Sticker src="sticker-sachet" pos="bl" w={100} r="-8deg" ox="12%" lazy />{" "}
          </>
        }
      />
      <BrandsCta />
    </RouteView>
  );
}
