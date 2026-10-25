import { Split } from "@/components/ui/Split";
import { Heading, Label } from "@/components/ui/Text";

export function SecurityIntro() {
  return (
    <Split
      style={{ paddingBottom: "clamp(48px,6vw,80px)" }}
      stickers={[
        { src: "sticker-stamp", pos: "at", x: "30%", y: "30%", w: 150, r: "-9deg" },
        { src: "sticker-notebook", pos: "at", x: "70%", y: "42%", w: 130, r: "10deg" },
        { src: "sticker-phone", pos: "at", x: "46%", y: "78%", w: 120, r: "-5deg" },
      ]}
    >
      <Label>Trust</Label>
      <Heading as="h1" size="d1" reveal style={{ marginTop: "24px", maxWidth: "14em" }}>
        Shops own their data. Mimi never touches the money.
      </Heading>
    </Split>
  );
}
