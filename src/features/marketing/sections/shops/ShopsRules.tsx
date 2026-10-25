import { PointList } from "@/components/ui/Cards";
import { MediaSplit } from "@/components/ui/MediaSplit";
import { Heading, Label } from "@/components/ui/Text";
import { shopsDataPhoto, shopsDataRules } from "@/features/marketing/content/shops";

/** Your data: your book, your rules. */
export function ShopsRules() {
  return (
    <MediaSplit
      photo={shopsDataPhoto}
      stickers={[
        { src: "sticker-receipt", pos: "tr", w: 110, r: "-9deg", ox: "8%", oy: "-56px", lazy: true },
      ]}
      photoStickers={[
        {
          src: "sticker-cash",
          pos: "tr",
          w: 140,
          r: "11deg",
          ox: "-22px",
          oy: "-36px",
          depth: 0.6,
          lazy: true,
        },
        {
          src: "sticker-pos",
          pos: "bl",
          w: 110,
          r: "-8deg",
          ox: "-18px",
          oy: "-34px",
          depth: 0.8,
          lazy: true,
        },
      ]}
    >
      <Label>Your data</Label>
      <Heading size="d2" reveal>
        Your book, your rules.
      </Heading>
      <PointList items={shopsDataRules} />
    </MediaSplit>
  );
}
