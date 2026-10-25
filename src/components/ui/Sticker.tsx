import { Fragment, type CSSProperties } from "react";
import { cx } from "@/lib/cx";

export type StickerName =
  | "sticker-cash"
  | "sticker-crate"
  | "sticker-goods"
  | "sticker-keke"
  | "sticker-notebook"
  | "sticker-oil"
  | "sticker-phone"
  | "sticker-pin"
  | "sticker-pos"
  | "sticker-receipt"
  | "sticker-sachet"
  | "sticker-stamp"
  | "sticker-sugar"
  | "sticker-van";

/**
 * Where a sticker sits: a corner of its section (tl/tr/bl/br), on a section header (hd), inside a
 * card (in), at a percentage point (at, uses x/y), or in the normal flow (flow).
 */
export type StickerPos = "tl" | "tr" | "bl" | "br" | "hd" | "in" | "at" | "flow";

export type StickerSpec = {
  src: StickerName;
  pos: StickerPos;
  /** Size in px at desktop (scales down with the viewport). */
  w: number;
  /** Rotation, e.g. "-8deg". */
  r: string;
  /** Offsets from the anchored edges ("12%", "-24px"). */
  ox?: string;
  oy?: string;
  /** Position for `at` stickers ("30%"), with optional mobile overrides. */
  x?: string;
  y?: string;
  mx?: string;
  my?: string;
  /** Scroll parallax strength (default 0.5). */
  depth?: number;
  /** Below the fold: let the browser load it lazily. */
  lazy?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * A die-cut sticker. The drag > pop > bob layers are rendered on the server; the behaviour
 * (pop-in, drag with spring-back, parallax, keep-in-viewport) comes from the sticker motion hooks.
 * Decorative, so hidden from assistive tech.
 */
export function Sticker({
  src,
  pos,
  w,
  r,
  ox,
  oy,
  x,
  y,
  mx,
  my,
  depth,
  lazy,
  className,
  style,
}: StickerSpec) {
  const vars: CSSProperties = {
    ...(x !== undefined && { "--x": x }),
    ...(y !== undefined && { "--y": y }),
    "--w": String(w),
    "--r": r,
    ...(ox !== undefined && { "--ox": ox }),
    ...(oy !== undefined && { "--oy": oy }),
    ...(mx !== undefined && { "--mx": mx }),
    ...(my !== undefined && { "--my": my }),
    ...style,
  };
  return (
    <i
      className={cx("x-st", `x-st--${pos}`, className)}
      style={vars}
      aria-hidden="true"
      data-depth={depth !== undefined ? String(depth) : undefined}
    >
      <span className="x-st__d">
        <span className="x-st__p">
          <span className="x-st__b">
            <img src={`/stickers/${src}.webp`} alt="" draggable={false} loading={lazy ? "lazy" : undefined} />
          </span>
        </span>
      </span>
    </i>
  );
}

/**
 * Several stickers in a row. Stickers are inline elements, so (as in the original markup) they are
 * separated by spaces; `lead`/`trail` add the space before the first / after the last one.
 */
export function Stickers({
  items,
  lead,
  trail = true,
}: {
  items: readonly StickerSpec[];
  lead?: boolean;
  trail?: boolean;
}) {
  if (!items.length) return null;
  return (
    <>
      {items.map((s, i) => (
        <Fragment key={i}>
          {lead || i > 0 ? " " : null}
          <Sticker {...s} />
        </Fragment>
      ))}
      {trail ? " " : null}
    </>
  );
}

/** Every sticker image, in the order the original page first used them (the tap-to-slap pool). */
export const STICKER_POOL: readonly StickerName[] = [
  "sticker-crate",
  "sticker-cash",
  "sticker-keke",
  "sticker-goods",
  "sticker-notebook",
  "sticker-van",
  "sticker-pin",
  "sticker-receipt",
  "sticker-stamp",
  "sticker-pos",
  "sticker-sachet",
  "sticker-phone",
  "sticker-oil",
  "sticker-sugar",
];
