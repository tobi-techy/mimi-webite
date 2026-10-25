import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { AboutBeliefs } from "@/features/marketing/sections/about/AboutBeliefs";
import { AboutCta } from "@/features/marketing/sections/about/AboutCta";
import { AboutIntro } from "@/features/marketing/sections/about/AboutIntro";
import { AboutTeam } from "@/features/marketing/sections/about/AboutTeam";
import { AboutWhy } from "@/features/marketing/sections/about/AboutWhy";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Built in Nigeria for the people who keep shelves full. Mimi is built by Rail Technology Concepts Ltd.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <RouteView route="about">
      <JsonLd data={breadcrumbJsonLd([{ name: "About", path: "/about" }])} />
      <AboutIntro />
      <AboutWhy />
      <AboutBeliefs />
      <AboutTeam />
      <AboutCta />
    </RouteView>
  );
}
