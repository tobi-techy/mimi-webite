import type { Metadata, Viewport } from "next";
import { absoluteUrl, site } from "@/config/site";

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
  image?: { url: string; width: number; height: number; alt: string };
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
  image = site.ogImage,
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
    legalName: site.legalName,
    url: site.url,
    logo: absoluteUrl("/apple-touch-icon.png"),
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

/** Mimi as software. No ratings and no offers: pricing is a pilot proposal, not a live price list. */
export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    url: site.url,
    description: site.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "WhatsApp",
    publisher: { "@id": orgId },
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
