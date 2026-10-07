export type Placement = {
  x: number;
  y: number;
  size: number;
  rotation: number;
};

export type StickerConfig = Placement & {
  id: string;
  src: string;
  aspect: number;
  layer: 1 | 2 | 3 | 4;
  mass: number;
  friction: number;
  restitution: number;
  air: number;
  angular: number;
  flex: number;
  hoverScale: number;
  grabScale: number;
  squash: [number, number];
  mobile?: Partial<Placement>;
};

/*
 * x/y are sticker centres as fractions of the hero, size is the longest edge in px
 * on the 1440×900 reference canvas. Layer 1 is the lightest and sits on top of the
 * pile, layer 4 holds the hero humans at the bottom. Stickers with `mobile` are the
 * ones kept on phones, with their phone placement.
 */
const BASE_STICKERS: StickerConfig[] = [
  { id: "market-woman", src: "/assets/sticker-market-woman.webp", aspect: 0.975, layer: 4, mass: 3.0, friction: 0.9, restitution: 0.18, air: 0.0004, angular: 0.25, flex: 0, hoverScale: 1.015, grabScale: 1.03, squash: [1, 1], x: 0.155, y: 0.84, size: 310, rotation: -6, mobile: { x: 0.23, y: 0.86, size: 205 } },
  { id: "business-owner", src: "/assets/sticker-business-owner.webp", aspect: 0.935, layer: 4, mass: 2.2, friction: 0.9, restitution: 0.18, air: 0.0004, angular: 0.3, flex: 0, hoverScale: 1.015, grabScale: 1.03, squash: [1, 1], x: 0.735, y: 0.9, size: 270, rotation: 5 },
  { id: "ledger", src: "/assets/sticker-ledger.webp", aspect: 1.252, layer: 3, mass: 1.7, friction: 0.9, restitution: 0.15, air: 0.0005, angular: 0.4, flex: 0, hoverScale: 1.02, grabScale: 1.035, squash: [1, 1], x: 0.5, y: 0.94, size: 230, rotation: 5, mobile: { x: 0.46, y: 1.0, size: 130 } },
  { id: "carton", src: "/assets/sticker-carton.webp", aspect: 1.361, layer: 3, mass: 1.5, friction: 0.9, restitution: 0.18, air: 0.0005, angular: 0.45, flex: 0, hoverScale: 1.02, grabScale: 1.035, squash: [1, 1], x: 0.035, y: 0.96, size: 220, rotation: 4 },
  { id: "petrol-nozzle", src: "/assets/sticker-petrol-nozzle.webp", aspect: 0.993, layer: 3, mass: 1.8, friction: 0.9, restitution: 0.16, air: 0.0005, angular: 0.4, flex: 0, hoverScale: 1.02, grabScale: 1.035, squash: [1, 1], x: 0.965, y: 0.4, size: 210, rotation: -15 },
  { id: "pos", src: "/assets/sticker-pos.webp", aspect: 0.911, layer: 2, mass: 1.3, friction: 0.92, restitution: 0.2, air: 0.0006, angular: 0.55, flex: 0, hoverScale: 1.02, grabScale: 1.04, squash: [1, 1], x: 0.935, y: 0.72, size: 175, rotation: 8, mobile: { x: 0.86, y: 0.87, size: 120 } },
  { id: "calculator", src: "/assets/sticker-calculator.webp", aspect: 1.221, layer: 2, mass: 1.2, friction: 0.94, restitution: 0.2, air: 0.0006, angular: 0.65, flex: 0, hoverScale: 1.02, grabScale: 1.04, squash: [1, 1], x: 0.615, y: 0.855, size: 175, rotation: -8, mobile: { x: 0.62, y: 0.93, size: 118 } },
  { id: "phone", src: "/assets/sticker-phone.webp", aspect: 0.781, layer: 2, mass: 0.8, friction: 0.94, restitution: 0.25, air: 0.0008, angular: 0.8, flex: 0, hoverScale: 1.025, grabScale: 1.045, squash: [1, 1], x: 0.875, y: 0.55, size: 165, rotation: 13, mobile: { x: 0.07, y: 0.66, size: 104 } },
  { id: "shopping-bag", src: "/assets/sticker-shopping-bag.webp", aspect: 0.835, layer: 2, mass: 0.45, friction: 0.975, restitution: 0.2, air: 0.002, angular: 1.0, flex: 0.5, hoverScale: 1.03, grabScale: 1.05, squash: [0.98, 1.02], x: 0.865, y: 0.93, size: 200, rotation: -7, mobile: { x: 0.97, y: 0.98, size: 118 } },
  { id: "cash-envelope", src: "/assets/sticker-cash-envelope.webp", aspect: 1.119, layer: 1, mass: 0.5, friction: 0.985, restitution: 0.22, air: 0.002, angular: 1.1, flex: 0.3, hoverScale: 1.03, grabScale: 1.05, squash: [0.99, 1.01], x: 0.285, y: 0.975, size: 160, rotation: 7 },
  { id: "indomie", src: "/assets/sticker-indomie.webp", aspect: 1.274, layer: 1, mass: 0.35, friction: 0.975, restitution: 0.28, air: 0.0025, angular: 1.5, flex: 1, hoverScale: 1.035, grabScale: 1.05, squash: [0.95, 1.03], x: 0.335, y: 0.82, size: 175, rotation: 11, mobile: { x: 0.6, y: 0.78, size: 120 } },
  { id: "peak", src: "/assets/sticker-peak.webp", aspect: 1.01, layer: 1, mass: 0.4, friction: 0.975, restitution: 0.26, air: 0.0022, angular: 1.2, flex: 0.7, hoverScale: 1.035, grabScale: 1.05, squash: [0.97, 1.02], x: 0.975, y: 0.96, size: 150, rotation: -13, mobile: { x: 0.94, y: 0.72, size: 100 } },
  { id: "naira", src: "/assets/sticker-naira.webp", aspect: 1.874, layer: 1, mass: 0.15, friction: 0.985, restitution: 0.3, air: 0.0035, angular: 1.7, flex: 1, hoverScale: 1.04, grabScale: 1.06, squash: [0.98, 1.02], x: 0.835, y: 0.2, size: 200, rotation: 17, mobile: { x: 0.8, y: 0.16, size: 128 } },
  { id: "receipt", src: "/assets/sticker-receipt.webp", aspect: 0.94, layer: 1, mass: 0.25, friction: 0.985, restitution: 0.3, air: 0.0032, angular: 1.8, flex: 1, hoverScale: 1.04, grabScale: 1.06, squash: [0.98, 1.02], x: 0.115, y: 0.25, size: 150, rotation: -18, mobile: { x: 0.15, y: 0.17, size: 96 } },
  { id: "invoice", src: "/assets/sticker-invoice.webp", aspect: 1.02, layer: 1, mass: 0.25, friction: 0.985, restitution: 0.3, air: 0.003, angular: 1.6, flex: 0.9, hoverScale: 1.04, grabScale: 1.06, squash: [0.98, 1.02], x: 0.075, y: 0.52, size: 165, rotation: -11 },
];

/* Extra copies of each object fill the lower band. The hero humans are excluded so
 * their faces stay unique and copies sit behind everything (layer 4) so they never
 * paint over a face. Phones keep a narrower pile: two copies of each light object
 * and one of each heavy one, laid out on their own grid. */
const REPEAT_LAYER = 4 as const;
const REPEAT_COUNT = 2;
const REPEAT_EXCLUDED = new Set(["market-woman", "business-owner"]);
const REPEAT_BAND = { top: 0.6, bottom: 1.08 };
const REPEAT_SIZE = { min: 0.46, max: 0.68 };
const REPEAT_TILT = 26;
const REPEAT_LIGHT_MASS = 0.5;
const REPEAT_MOBILE_BAND = { top: 0.55, bottom: 1.08 };
const REPEAT_MOBILE_LIGHT = { min: 46, max: 62 };
const REPEAT_MOBILE_HEAVY = { min: 54, max: 76 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Copy = { sticker: StickerConfig; copy: number };

function shuffle<T>(items: T[], random: () => number) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function layOut(items: Copy[], columns: number, random: () => number, jitter: number) {
  const rows = Math.ceil(items.length / columns);
  return items.map(({ sticker, copy }, i) => {
    const column = i % columns;
    const row = Math.floor(i / columns);
    return {
      sticker,
      copy,
      x: clamp((column + 0.5 + (random() - 0.5) * jitter) / columns, -0.02, 1.02),
      y: (row + 0.5 + (random() - 0.5) * jitter) / rows,
    };
  });
}

function buildRepeats(base: StickerConfig[]): StickerConfig[] {
  const random = seededRandom(20261007);
  const copies: Copy[] = [];
  for (const sticker of base) {
    if (REPEAT_EXCLUDED.has(sticker.id)) continue;
    for (let n = 0; n < REPEAT_COUNT; n++) copies.push({ sticker, copy: n });
  }

  const desktopColumns = clamp(Math.round(Math.sqrt(copies.length * 2.6)), 5, 11);
  const desktop = layOut(shuffle([...copies], random), desktopColumns, random, 0.7);

  const phonePool = copies.filter(({ sticker, copy }) => copy === 0 || sticker.mass <= REPEAT_LIGHT_MASS);
  const phone = layOut(shuffle([...phonePool], random), clamp(Math.round(Math.sqrt(phonePool.length * 2.2)), 4, 7), random, 0.8);
  const phonePlacements = new Map(phone.map((p) => [`${p.sticker.id}:${p.copy}`, p]));

  const band = REPEAT_BAND.bottom - REPEAT_BAND.top;
  const phoneBand = REPEAT_MOBILE_BAND.bottom - REPEAT_MOBILE_BAND.top;

  return desktop.map(({ sticker, copy, x, y }, i) => {
    const placement = phonePlacements.get(`${sticker.id}:${copy}`);
    const range = sticker.mass <= REPEAT_LIGHT_MASS ? REPEAT_MOBILE_LIGHT : REPEAT_MOBILE_HEAVY;
    return {
      ...sticker,
      id: `${sticker.id}-${i}`,
      x,
      y: REPEAT_BAND.top + y * band,
      size: Math.round(sticker.size * (REPEAT_SIZE.min + random() * (REPEAT_SIZE.max - REPEAT_SIZE.min))),
      rotation: clamp(sticker.rotation + (random() - 0.5) * REPEAT_TILT, -24, 24),
      layer: REPEAT_LAYER,
      mobile: placement
        ? {
            x: placement.x,
            y: REPEAT_MOBILE_BAND.top + placement.y * phoneBand,
            size: Math.round(range.min + random() * (range.max - range.min)),
          }
        : undefined,
    };
  });
}

/* Repeats come first so they sort beneath the base stickers inside layer 4. */
export const STICKERS: StickerConfig[] = [...buildRepeats(BASE_STICKERS), ...BASE_STICKERS];
