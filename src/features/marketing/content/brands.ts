import type { AgentDetailSpec } from "@/features/marketing/components/AgentDetail";
import type { NumberedItem } from "@/components/ui/Cards";
import type { PhotoSpec } from "@/components/ui/Photo";

export const brandsHero = {
  label: "For FMCG brands",
  title: "See what really sold. Shop by shop.",
  lead: "Mimi turns consented shop books across your distributors into weekly sell-through, promo proof and claims you can trust.",
  photo: {
    src: "photo2-shelf",
    alt: "A hand straightening products on a colourful store shelf",
  } satisfies PhotoSpec,
};

export const brandProblems: NumberedItem[] = [
  { title: "Brands see what distributors bought, not what shops sold." },
  { title: "Trade promo money goes out with no proof it ran." },
  { title: "Claims arrive as spreadsheets nobody can check." },
];

const next = { status: "next", statusLabel: "Next" } as const;

export const brandAgents: AgentDetailSpec[] = [
  {
    ...next,
    name: "Sell-through",
    does: [
      "Weekly sales by shop, area and product, from consented data.",
      "Shops that stopped stocking a product.",
      "Distributor purchases against real shop sales.",
    ],
    coming: "Street price watch.",
  },
  {
    ...next,
    name: "Promo Check",
    sticker: { src: "sticker-receipt", pos: "in", w: 110, r: "10deg", ox: "12%", oy: "-6px", lazy: true },
    does: [
      "Shelf or poster photos from shops during a promo.",
      "Each photo checked for product, poster and price.",
      "Which shops ran it, and the sales lift.",
    ],
  },
  {
    ...next,
    name: "Claims Check",
    does: [
      "Checks each distributor claim against deliveries, payments and shop confirmations.",
      "Before you pay.",
    ],
  },
  {
    ...next,
    name: "Shop Reach",
    does: [
      "Reaches consenting shops on WhatsApp with launches, price changes and offers.",
      "Confirms who saw them.",
    ],
  },
  {
    ...next,
    name: "Safety",
    does: [
      "Recall in an hour: tells every affected shop and tracks who pulled stock.",
      "Watches for fake and grey stock.",
    ],
  },
];

/**
 * Brand view example: shop rows fold into area totals. `t` = ms after the panel is seen;
 * `to` = how far (in rows) each shop row travels as it folds away.
 */
export const brandViewExample = {
  product: "Peak Milk 400g · 1 week",
  shops: [
    { name: "Iya Basira Stores", area: "Surulere", qty: "18 ctn", t: 800, to: "0" },
    { name: "Ade Stores", area: "Surulere", qty: "16 ctn", t: 840, to: "-1" },
    { name: "Blessing Supermart", area: "Surulere", qty: "12 ctn", t: 880, to: "-2" },
    { name: "Mama Chi Provisions", area: "Yaba", qty: "14 ctn", t: 920, to: "-1.7" },
    { name: "Kola and Sons", area: "Yaba", qty: "13 ctn", t: 960, to: "-2.7" },
    { name: "Faith Kiosk", area: "Yaba", qty: "11 ctn", t: 1000, to: "-3.7" },
  ],
  totals: [
    { name: "Surulere", note: "3 shops", qty: "46 ctn", t: 1180 },
    { name: "Yaba", note: "3 shops", qty: "38 ctn", t: 1260 },
    { name: "All shops", note: "6 shops", qty: "84 ctn", t: 1340, all: true },
  ],
  note: { text: "Brands see totals by default, not shop-level rows.", t: 1420 },
};

export const sponsorSteps: NumberedItem[] = [
  { title: "Pick a distributor.", body: "You sponsor a pilot on one of their routes." },
  {
    title: "The distributor gets Collector and Proof.",
    body: "Their money and their route, checked.",
  },
  { title: "You get sell-through from the same route.", body: "Shop by shop, every week." },
];
