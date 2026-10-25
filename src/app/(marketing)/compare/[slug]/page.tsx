import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { CompareDetail } from "@/features/marketing/sections/compare/CompareDetail";
import { JsonLd } from "@/components/ui/JsonLd";
import { COMPARE_CHECKED_ISO, comparisons, getComparison } from "@/features/marketing/content/compare";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getComparison((await params).slug);
  if (!c) return {};
  return pageMetadata({
    absoluteTitle: `${c.name} vs Mimi: ${c.hook} · ${site.name}`,
    description: c.metaDescription,
    path: `/compare/${c.slug}`,
    type: "article",
    publishedTime: COMPARE_CHECKED_ISO,
  });
}

export default async function CompareSlugPage({ params }: Props) {
  const c = getComparison((await params).slug);
  if (!c) notFound();
  const path = `/compare/${c.slug}`;
  return (
    <RouteView route="compare">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Compare", path: "/compare" },
            { name: `${c.name} vs Mimi`, path },
          ]),
          faqJsonLd(c.faq),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${c.name} vs Mimi: ${c.hook}`,
            description: c.metaDescription,
            datePublished: COMPARE_CHECKED_ISO,
            dateModified: COMPARE_CHECKED_ISO,
            publisher: { "@id": absoluteUrl("/#organization") },
            mainEntityOfPage: absoluteUrl(path),
          },
        ]}
      />
      <CompareDetail c={c} />
    </RouteView>
  );
}
