import type { MetadataRoute } from "next";
import { CONSOLE_ONLY, routes } from "@/config/routes";
import { absoluteUrl, site } from "@/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  /* console-only build (console.userail.money): a demo with sample data, nothing to index */
  if (CONSOLE_ONLY) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    /* the console is a demo with sample data (also noindex in its layout) */
    rules: [{ userAgent: "*", allow: "/", disallow: routes.console }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}
