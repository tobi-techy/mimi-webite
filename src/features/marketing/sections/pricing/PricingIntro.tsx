import { Split } from "@/components/ui/Split";
import { Heading, Label, Lead } from "@/components/ui/Text";

export function PricingIntro() {
  return (
    <Split
      style={{ paddingBottom: "clamp(48px,6vw,80px)" }}
      stickers={[
        { src: "sticker-cash", pos: "at", x: "30%", y: "30%", w: 160, r: "-9deg" },
        { src: "sticker-receipt", pos: "at", x: "68%", y: "38%", w: 140, r: "10deg" },
        { src: "sticker-crate", pos: "at", x: "46%", y: "76%", w: 170, r: "-4deg" },
      ]}
    >
      <Label>Pilot pricing · per active shop · per month · to be confirmed with pilot distributors</Label>
      <Heading as="h1" size="d1" reveal style={{ marginTop: "24px", maxWidth: "12em" }}>
        Priced per shop. Pays for itself on the route.
      </Heading>
      <Lead reveal style={{ marginTop: "24px" }}>
        Shops always use Mimi free.
      </Lead>
    </Split>
  );
}
