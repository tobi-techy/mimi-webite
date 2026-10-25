import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { HomeAgents } from "@/features/marketing/sections/home/HomeAgents";
import { HomeConsole } from "@/features/marketing/sections/home/HomeConsole";
import { HomeCta } from "@/features/marketing/sections/home/HomeCta";
import { HomeFromBlog } from "@/features/marketing/sections/home/HomeFromBlog";
import { HomeHero } from "@/features/marketing/sections/home/HomeHero";
import { HomePaths } from "@/features/marketing/sections/home/HomePaths";
import { HomeProblem } from "@/features/marketing/sections/home/HomeProblem";
import { HomeQuote } from "@/features/marketing/sections/home/HomeQuote";
import { HomeShopsSayYes } from "@/features/marketing/sections/home/HomeShopsSayYes";
import { HomeTape } from "@/features/marketing/sections/home/HomeTape";
import { HomeWitnesses } from "@/features/marketing/sections/home/HomeWitnesses";
import { WorksWith } from "@/features/marketing/sections/WorksWith";
import { JsonLd } from "@/components/ui/JsonLd";
import { pageMetadata, softwareJsonLd } from "@/lib/seo";
import { site } from "@/config/site";

export const metadata = pageMetadata({ absoluteTitle: site.title, path: "/" });

export default function HomePage() {
  return (
    <RouteView route="">
      <JsonLd data={softwareJsonLd()} />
      <HomeHero />
      <HomePaths />
      <HomeProblem />
      <HomeWitnesses />
      <HomeConsole />
      <HomeAgents />
      <HomeTape />
      <WorksWith />
      <HomeShopsSayYes />
      <HomeQuote />
      <HomeFromBlog />
      <HomeCta />
    </RouteView>
  );
}
