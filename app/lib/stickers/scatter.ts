/*
 * The stickers that drop into the problem section. Every one is the same size: `size`
 * is the longest edge in px at the 1440 reference, and each sticker's box follows its
 * own aspect ratio from there, before `--sticker-scale` is applied. They sit above the
 * copy on a higher z-index and hang over the section edge, so they read as part of the
 * scene rather than as decoration placed around the text. `x` is the centre as a
 * fraction of the section width and `inset` is the gap from the edge they hang off.
 */
export type ScatterSticker = {
  id: string;
  src: string;
  aspect: number;
  rotation: number;
  x: number;
  anchor: "top" | "bottom";
  inset: number;
  fallAngle: number;
  phone?: boolean;
};

export const SCATTER_SIZE = 210;

export const PROBLEM_STICKERS: ScatterSticker[] = [
  { id: "naira", src: "/assets/sticker-naira.webp", aspect: 1.874, rotation: 11, x: 0.1, anchor: "top", inset: -34, fallAngle: 10, phone: true },
  { id: "indomie", src: "/assets/sticker-indomie.webp", aspect: 1.274, rotation: -9, x: 0.91, anchor: "top", inset: -30, fallAngle: -9, phone: true },
  { id: "calculator", src: "/assets/sticker-calculator.webp", aspect: 1.221, rotation: -7, x: 0.12, anchor: "bottom", inset: -30, fallAngle: -10, phone: true },
  { id: "receipt", src: "/assets/sticker-receipt.webp", aspect: 0.94, rotation: -13, x: 0.9, anchor: "bottom", inset: -26, fallAngle: -12 },
];
