export const SITE = {
  name: "Mimi",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mimi.africa",
  email: "contact@miriam.africa",
  legalName: "Rail Technology Concepts Ltd",
  rc: "RC 9322751",
  address: "No 8 Ifeoluwa Street, Nova Road 7, Ado-Ekiti, Ekiti State, Nigeria",
  description:
    "Mimi reads your stock book, checks payment alerts and tells you when to restock, all inside WhatsApp.",
} as const;

export type NavLink = { href: string; label: string };

/** Primary navigation, mirrored in the header pill and the mobile menu. */
export const NAV_LINKS: NavLink[] = [
  { href: "/shops", label: "For shops" },
  { href: "/distributors", label: "For distributors" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export const JOIN_HREF = "/#get-started";

export type FooterColumn = { title: string; links: NavLink[] };

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/shops", label: "For shops" },
      { href: "/distributors", label: "For distributors" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/", label: "About" },
      { href: JOIN_HREF, label: "Join the pilot" },
      { href: `mailto:${SITE.email}`, label: SITE.email },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];
