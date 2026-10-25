import type { MetadataRoute } from "next";
import { routes } from "@/config/routes";
import { absoluteUrl, site } from "@/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    /* the console is a demo with sample data (also noindex in its layout) */
    rules: [{ userAgent: "*", allow: "/", disallow: routes.console }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
