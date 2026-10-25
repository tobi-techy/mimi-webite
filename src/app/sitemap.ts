import type { MetadataRoute } from "next";
import { comparisons } from "@/features/marketing/content/compare";
import { posts } from "@/features/marketing/content/posts";
import { absoluteUrl } from "@/config/site";

export const dynamic = "force-static";

const pages = [
  "/",
  "/distributors",
  "/brands",
  "/shops",
  "/pricing",
  "/compare",
  "/about",
  "/security",
  "/new-name",
  "/contact",
  "/brand-kit",
  "/blog",
  "/signup",
  "/terms",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const newest = posts
    .map((p) => p.date)
    .sort()
    .at(-1);
  return [
    ...pages.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      ...(path === "/blog" && newest ? { lastModified: newest } : {}),
    })),
    ...comparisons.map((c) => ({
      url: absoluteUrl(`/compare/${c.slug}`),
      lastModified: "2026-10-24",
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
