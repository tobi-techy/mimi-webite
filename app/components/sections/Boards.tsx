import { Big, Lab, Tp } from "../Tile";
import { StickerCluster, type StickerPlacement } from "../StickerCluster";

export type BentoItem = {
  area: "a" | "b" | "c" | "d" | "e";
  lab: string;
  big: string;
  tp?: string;
  /** Split tiles put the sticker pile in a second column beside the copy. */
  split?: boolean;
  pile?: "short" | "tall";
  stickers: StickerPlacement[];
};

const AREA: Record<BentoItem["area"], string> = {
  a: "area-a",
  b: "area-b",
  c: "area-c",
  d: "area-d",
  e: "area-e",
};

const PILE = { short: "pile pile-short", tall: "pile pile-tall", default: "pile" } as const;

/** One of the bento boards (home "plate", shops "get", distributors "see"). */
export function BentoBoard({ variant, items }: { variant: "home" | "five"; items: BentoItem[] }) {
  return (
    <div className={`board ${variant === "home" ? "board-home" : "board-five"}`}>
      {items.map((item) => (
        <article
          key={item.area}
          data-reveal
          className={`relative flex min-w-0 flex-col gap-3 rounded-sheet bg-tint2 p-[clamp(20px,2.4vw,30px)] ${AREA[item.area]} ${
            item.split ? "tile-split" : ""
          }`}
        >
          <Lab>{item.lab}</Lab>
          <StickerCluster className={item.pile ? PILE[item.pile] : PILE.default} items={item.stickers} />
          <Big className={item.split ? "tile-big" : ""}>{item.big}</Big>
          {item.tp ? <Tp>{item.tp}</Tp> : null}
        </article>
      ))}
    </div>
  );
}
