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
  url: trimSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://miriam.africa"),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@miriam.africa",
  /** International format, digits only. Empty hides every WhatsApp button. */
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP || "").replace(/\D/g, ""),
  /** When set, the contact form POSTs JSON here; otherwise it falls back to mailto. */
  formEndpoint: process.env.NEXT_PUBLIC_FORM_ENDPOINT || "",
  title: "Mimi · AI agents for FMCG distribution",
  shareTitle: "Mimi · The route, the shop, the money. One book.",
  description:
    "Mimi is a team of AI agents on WhatsApp for FMCG distributors and brands. It collects what shops owe, catches leaks on the route and shows brands what really sold. Shops use it free.",
  ogImage: {
    url: "/og-image.jpg",
    width: 1200,
    height: 630,
    alt: "Mimi: the route, the shop, the money. One book.",
  },
  themeColor: "#101010",
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
