import type { NumberedItem } from "@/components/ui/Cards";
import type { PhotoSpec } from "@/components/ui/Photo";
import type { StickerSpec } from "@/components/ui/Sticker";

export const aboutWhy = [
  "Distributors run on notebooks, WhatsApp and memory: who owes what, which shop took which carton, whether that transfer alert is real. Brands see what left the warehouse, not what sold.",
  "Mimi puts the route, the shop and the money in one book that all three can trust, with AI agents that work inside WhatsApp, where the trade already happens.",
];

/** The notebook sticker beside "Why Mimi" (the copy opens on notebooks). */
export const aboutWhySticker: StickerSpec = {
  src: "sticker-notebook",
  pos: "at",
  x: "56%",
  y: "50%",
  w: 220,
  r: "-7deg",
  depth: 0.4,
  lazy: true,
};

export const beliefs: NumberedItem[] = [
  { title: "Work where people already are", body: "WhatsApp, not another app." },
  { title: "The owner decides", body: "Agents draft, people approve." },
  { title: "Shops own their data", body: "Each shop chooses who sees its book." },
];

export const founder = {
  name: "Oluwatobiloba (Tobi) Omotade",
  role: "Founder",
  bio: "Self-taught engineer building AI agents for African commerce.",
  link: { href: "https://x.com/Tobi_Builder", label: "Tobi on X →" },
  photo: {
    src: "photo-notebook",
    alt: "A distributor's handwritten notebook of shops and balances",
  } satisfies PhotoSpec,
};
