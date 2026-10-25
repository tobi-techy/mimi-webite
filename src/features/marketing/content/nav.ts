/** Navigation and footer links. `key` is the route the link marks as current in the nav. */
export type NavLink = { href: string; label: string; key: string };

export const primaryNav: NavLink[] = [
  { href: "/distributors", label: "Distributors", key: "distributors" },
  { href: "/brands", label: "Brands", key: "brands" },
  { href: "/shops", label: "Shops", key: "shops" },
  { href: "/pricing", label: "Pricing", key: "pricing" },
  { href: "/compare", label: "Compare", key: "compare" },
  { href: "/about", label: "About", key: "about" },
];

export const secondaryNav: NavLink[] = [
  { href: "/console", label: "Live demo", key: "demo" },
  { href: "/blog", label: "Blog", key: "blog" },
];

/** The one call to action in the nav: the pilot request form. */
export const pilotHref = "/contact";

export const footerNav = {
  product: [
    { href: "/distributors", label: "Distributors" },
    { href: "/brands", label: "Brands" },
    { href: "/shops", label: "Shops" },
    { href: "/pricing", label: "Pricing" },
    { href: "/compare", label: "Compare" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/brand-kit", label: "Brand kit" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "/security", label: "Security" },
  ],
};
