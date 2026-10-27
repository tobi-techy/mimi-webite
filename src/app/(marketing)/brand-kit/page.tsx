import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { BrandKitAbout } from "@/features/marketing/sections/brand-kit/BrandKitAbout";
import { BrandKitColour } from "@/features/marketing/sections/brand-kit/BrandKitColour";
import { BrandKitCta } from "@/features/marketing/sections/brand-kit/BrandKitCta";
import { BrandKitHelpers } from "@/features/marketing/sections/brand-kit/BrandKitHelpers";
import { BrandKitIntro } from "@/features/marketing/sections/brand-kit/BrandKitIntro";
import { BrandKitLogos } from "@/features/marketing/sections/brand-kit/BrandKitLogos";
import { BrandKitMascot } from "@/features/marketing/sections/brand-kit/BrandKitMascot";
import { BrandKitStickers } from "@/features/marketing/sections/brand-kit/BrandKitStickers";
import { BrandKitType } from "@/features/marketing/sections/brand-kit/BrandKitType";
import { BrandKitVoice } from "@/features/marketing/sections/brand-kit/BrandKitVoice";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Brand kit",
  description:
    "The Mimi brand kit: logo and mark downloads, the mascot and her six helpers, colours, type, stickers and approved descriptions for press and partners.",
  path: "/brand-kit",
});

export default function BrandKitPage() {
  return (
    <RouteView route="brand-kit">
      <JsonLd data={breadcrumbJsonLd([{ name: "Brand kit", path: "/brand-kit" }])} />
      <BrandKitIntro />
      <BrandKitAbout />
      <BrandKitLogos />
      <BrandKitMascot />
      <BrandKitHelpers />
      <BrandKitColour />
      <BrandKitType />
      <BrandKitStickers />
      <BrandKitVoice />
      <BrandKitCta />
    </RouteView>
  );
}
