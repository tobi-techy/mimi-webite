import { PointList } from "@/components/ui/Cards";
import { Split } from "@/components/ui/Split";
import { Heading, Label } from "@/components/ui/Text";
import { dataHandling } from "@/features/marketing/content/security";

export function SecurityData() {
  return (
    <Split
      tone="cream"
      id="sec-data"
      reveal
      stickers={[
        { src: "sticker-crate", pos: "at", x: "40%", y: "40%", w: 150, r: "-10deg", lazy: true },
        { src: "sticker-pin", pos: "at", x: "68%", y: "72%", w: 110, r: "12deg", lazy: true },
      ]}
    >
      <Label>03 / Data handling</Label>
      <Heading size="d2" reveal style={{ marginTop: "20px" }}>
        How we handle data.
      </Heading>
      <PointList items={dataHandling} />
      <p className="x-fine">Security practices are being finalised during pilots. Ask us for details.</p>
    </Split>
  );
}
