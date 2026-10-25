import { Split } from "@/components/ui/Split";
import { Heading, Label, Lead } from "@/components/ui/Text";
import { site } from "@/config/site";

export function AboutIntro() {
  return (
    <Split
      style={{ paddingBottom: "clamp(48px,6vw,80px)" }}
      stickers={[
        { src: "sticker-van", pos: "at", x: "30%", y: "30%", w: 160, r: "-8deg" },
        { src: "sticker-sachet", pos: "at", x: "70%", y: "40%", w: 130, r: "10deg" },
        { src: "sticker-goods", pos: "at", x: "44%", y: "78%", w: 150, r: "-4deg" },
      ]}
    >
      <Label>About</Label>
      <Heading as="h1" size="d1" reveal style={{ marginTop: "24px", maxWidth: "14em" }}>
        Built in Nigeria for the people who keep shelves full.
      </Heading>
      <Lead reveal style={{ marginTop: "24px" }}>
        Mimi is built by {site.legalName}.
      </Lead>
    </Split>
  );
}
