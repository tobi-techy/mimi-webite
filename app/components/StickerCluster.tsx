import type { CSSProperties } from "react";

import { Sticker } from "./Sticker";
import type { StickerName } from "@/content/stickers";

export type StickerSize = "xl" | "l" | "m" | "xs" | "sign";

export const SIZE_CLASS: Record<StickerSize, string> = {
  xl: "stk-xl",
  l: "stk-l",
  m: "stk-m",
  xs: "stk-xs",
  sign: "stk-sign",
};

export type StickerPlacement = {
  name: StickerName;
  rotation: number;
  size?: StickerSize;
  /** Position utilities, e.g. `"left-0 top-[10%]"`. */
  at?: string;
  /** Extra classes, e.g. a hero slot like `"hero-stk hero-stk-a"`. */
  className?: string;
  delay?: number;
};

type StickerClusterProps = {
  items: StickerPlacement[];
  className?: string;
  style?: CSSProperties;
};

/** A loose pile of stickers, positioned by each placement. Decorative. */
export function StickerCluster({ items, className = "", style }: StickerClusterProps) {
  return (
    <div className={className} style={style} aria-hidden="true">
      {items.map((item, index) => (
        <Sticker
          key={`${item.name}-${index}`}
          name={item.name}
          rotation={item.rotation}
          delay={item.delay}
          className={`absolute ${item.size ? SIZE_CLASS[item.size] : ""} ${item.at ?? ""} ${item.className ?? ""}`.trim()}
        />
      ))}
    </div>
  );
}
