import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { AboutBeliefs } from "@/features/marketing/sections/about/AboutBeliefs";
import { AboutCta } from "@/features/marketing/sections/about/AboutCta";
import { AboutIntro } from "@/features/marketing/sections/about/AboutIntro";
import { AboutTeam } from "@/features/marketing/sections/about/AboutTeam";
import { AboutWhy } from "@/features/marketing/sections/about/AboutWhy";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Mimi, built in Nigeria for FMCG distribution",
  description:
    "Mimi is built in Ado-Ekiti by Rail Technology Concepts Ltd for the distributors, brands and shops that keep Nigerian shelves full.",
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
