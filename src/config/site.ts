/**
 * Site-wide configuration. Values come from public env vars (see .env.example) and default to
 * the original site's config, so the site works with no env file at all.
 */
const trimSlash = (url: string) => url.replace(/\/+$/, "");

export const site = {
  name: "Mimi",
  /** Company behind Mimi, as shown in the footer. */
  company: "Rail Money",
  legalName: "Rail Technology Concepts Ltd",
  registration: "RC 9322751",
  location: "Ado-Ekiti, Nigeria",
  founder: "Oluwatobiloba (Tobi) Omotade",
  url: trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://userail.money"),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "tobilobaomotade@userail.money",
  /** International format, digits only. Empty hides every WhatsApp button. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, ""),
  /** When set, the contact form POSTs JSON here; otherwise it falls back to mailto. */
  formEndpoint:
    process.env.NEXT_PUBLIC_FORM_ENDPOINT || "https://formsubmit.co/ajax/tobilobaomotade@userail.money",
  title: "Mimi: WhatsApp AI agents for FMCG distributors in Nigeria",
  shareTitle: "Mimi · The route, the shop, the money. One book.",
  description:
    "AI agents on WhatsApp for FMCG distributors and brands in Nigeria. Collect what shops owe, catch fake alerts and route leaks, and see what really sold. Free for shops.",
  /** Fallback share banner; each page has its own (src/config/share-banners.json, public/og/). */
  ogImage: {
    url: "/og/home.png",
    width: 1200,
    height: 630,
    alt: "Mimi: the route, the shop, the money. One book.",
  },
  themeColor: "#101010",
  /** Mimi's own social accounts: footer, contact page, Organization sameAs and twitter:site. */
  socials: [
    { key: "x", label: "X", handle: "@meetmimi_ng", href: "https://x.com/meetmimi_ng" },
    { key: "linkedin", label: "LinkedIn", handle: "Mimi", href: "https://www.linkedin.com/company/meetmimi" },
  ],
  twitterHandle: "@meetmimi_ng",
} as const;

export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function absoluteUrl(path = "/"): string {
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

/** mailto: link to the contact address, with an optional subject. */
export function mailto(subject?: string): string {
  return `mailto:${site.contactEmail}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}
