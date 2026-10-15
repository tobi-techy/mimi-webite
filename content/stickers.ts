export const STICKERS = {
  indomie: { src: "/images/sticker-indomie.webp", width: 800, height: 628 },
  naira: { src: "/images/sticker-naira.webp", width: 800, height: 427 },
  receipt: { src: "/images/sticker-receipt.webp", width: 752, height: 800 },
  calculator: { src: "/images/sticker-calculator.webp", width: 800, height: 655 },
  stockbook: { src: "/images/sticker-stockbook.webp", width: 800, height: 461 },
  pos: { src: "/images/sticker-pos.webp", width: 800, height: 727 },
  carton: { src: "/images/sticker-carton.webp", width: 800, height: 633 },
  phone: { src: "/images/sticker-phone.webp", width: 636, height: 800 },
  crate: { src: "/images/sticker-crate.webp", width: 758, height: 592 },
  ricesack: { src: "/images/sticker-ricesack.webp", width: 800, height: 402 },
  van: { src: "/images/sticker-van.webp", width: 800, height: 406 },
  waybill: { src: "/images/sticker-waybill.webp", width: 800, height: 633 },
  padlock: { src: "/images/sticker-padlock.webp", width: 800, height: 427 },
  milk: { src: "/images/sticker-milk.webp", width: 604, height: 652 },
  /** Brand-kit mark as a sticker, used for the footer sign-off. */
  mark: { src: "/brand/mark/mimi-mark-sticker.svg", width: 992, height: 1104 },
} as const;

export type StickerName = keyof typeof STICKERS;
