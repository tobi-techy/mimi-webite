import type { MetadataRoute } from "next";

import { SITE } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE.url}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/shops`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/distributors`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
