import type { Metadata, Viewport } from "next";
import { absoluteUrl, site } from "@/config/site";
import shareBanners from "@/config/share-banners.json";
import { formatPlanNaira, plans } from "@/features/marketing/content/pricing";

/** Favicons and theme colour, shared by the root layout and the global 404 (its own document). */
export const siteIcons: Metadata["icons"] = {
  icon: [
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/favicon.ico", sizes: "any" },
    { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
  ],
  apple: "/apple-touch-icon.png",
};

export const siteViewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
};

type ShareImage = { url: string; width: number; height: number; alt: string };

/**
 * The page's own 1200x630 share banner (public/og/<file>.png, rendered by
 * scripts/render-share-banners.mjs from src/config/share-banners.json), else the site default.
 */
export function shareImage(path: string): ShareImage {
  const b = shareBanners.banners.find((it) => it.path === path);
  if (!b) return site.ogImage;
  return { url: `/og/${b.file}.png`, width: 1200, height: 630, alt: `Mimi: ${b.title}` };
}

type PageMeta = {
  /** Page title; the root layout adds " · Mimi". Use `absoluteTitle` to skip the suffix. */
  title?: string;
  absoluteTitle?: string;
  description?: string;
  /** Route path, e.g. "/pricing". Used for the canonical URL and og:url. */
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  authors?: string[];
  /** Defaults to the page's share banner (shareImage). */
  image?: ShareImage;
  noindex?: boolean;
};

/** Per-route metadata: title, description, canonical, Open Graph and Twitter card. */
export function pageMetadata({
  title,
  absoluteTitle,
  description = site.description,
  path,
  type = "website",
  publishedTime,
  authors,
  image = shareImage(path),
  noindex,
}: PageMeta): Metadata {
  const shareTitle = absoluteTitle ?? (title ? `${title} · ${site.name}` : site.shareTitle);
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: site.name,
      title: shareTitle,
      description,
      url: path,
      locale: "en_NG",
      images: [image],
      ...(type === "article" ? { publishedTime, authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: site.twitterHandle,
      title: shareTitle,
      description,
      images: [image],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/* ---------- JSON-LD (schema.org) builders ---------- */

const orgId = absoluteUrl("/#organization");
const siteId = absoluteUrl("/#website");

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId,
    name: site.company,
    alternateName: [site.name, "Rail Technology Concepts"],
    legalName: site.legalName,
    url: site.url,
    logo: absoluteUrl("/brand-kit/mimi-app-icon.png"),
    areaServed: { "@type": "Country", name: "Nigeria" },
    email: site.contactEmail,
    founder: { "@type": "Person", name: site.founder },
    address: { "@type": "PostalAddress", addressLocality: "Ado-Ekiti", addressCountry: "NG" },
    brand: { "@type": "Brand", name: site.name },
    sameAs: site.socials.map((s) => s.href),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": siteId,
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": orgId },
  };
}

/**
 * Mimi as software, with the pilot plans as offers (per active shop, per month, in naira) and the
 * free shop plan. Pilot prices are proposals to be confirmed with pilot distributors; the
 * descriptions say so. No ratings: there are no public reviews yet.
 */
export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": absoluteUrl("/#software"),
    name: site.name,
    url: site.url,
    description: site.description,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Distributor management software",
    operatingSystem: "WhatsApp, Web",
    inLanguage: "en-NG",
    areaServed: { "@type": "Country", name: "Nigeria" },
    image: absoluteUrl(site.ogImage.url),
    publisher: { "@id": orgId },
    offers: [
      ...plans.map((p) => ({
        "@type": "Offer",
        name: `${p.name} (pilot pricing)`,
        description: `${formatPlanNaira(p.perShop)} per active shop per month, ${formatPlanNaira(p.monthlyMinimum)} monthly minimum. Pilot pricing, to be confirmed with pilot distributors.`,
        url: absoluteUrl("/pricing"),
        priceCurrency: "NGN",
        price: p.perShop,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: p.perShop,
          priceCurrency: "NGN",
          unitText: "active shop per month",
          referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitText: "MON" },
        },
        eligibleCustomerType: "Business",
      })),
      {
        "@type": "Offer",
        name: "Shops",
        description: "Shops always use Mimi free, through their distributor's link.",
        url: absoluteUrl("/shops"),
        priceCurrency: "NGN",
        price: 0,
      },
    ],
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function faqJsonLd(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
