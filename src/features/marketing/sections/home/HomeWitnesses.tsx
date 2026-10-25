import { PointList } from "@/components/ui/Cards";
import { MediaSplit } from "@/components/ui/MediaSplit";
import { Heading, Label, Lead } from "@/components/ui/Text";
import { witnesses, witnessesPhoto } from "@/features/marketing/content/home";

/** 03 / How it works: three witnesses for every naira. */
export function HomeWitnesses() {
  return (
    <MediaSplit
      id="witnesses"
      photo={witnessesPhoto}
      stickers={[{ src: "sticker-stamp", pos: "tr", w: 120, r: "-9deg", oy: "-56px", lazy: true }]}
      photoStickers={[
        {
          src: "sticker-pos",
          pos: "br",
          w: 140,
          r: "-11deg",
          ox: "-20px",
          oy: "-36px",
          depth: 0.5,
          lazy: true,
        },
        {
          src: "sticker-sachet",
          pos: "tl",
          w: 100,
          r: "10deg",
          ox: "-16px",
          oy: "-34px",
          depth: 0.7,
          lazy: true,
        },
      ]}
    >
      <Label>03 / How it works</Label>
      <Heading size="d2" reveal>
        Three witnesses for every naira.
      </Heading>
      <Lead>Mimi checks each payment against three sources that don't share a story.</Lead>
      <PointList items={witnesses} />
      <p className="x-gap">When they disagree, Mimi shows the gap, with the evidence.</p>
    </MediaSplit>
  );
}
