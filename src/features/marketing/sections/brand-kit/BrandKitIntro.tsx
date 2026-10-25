import { ButtonLink } from "@/components/ui/Button";
import { Split } from "@/components/ui/Split";
import { Heading, Label, Lead } from "@/components/ui/Text";
import { brandKitZip } from "@/features/marketing/content/brand-kit";
import { mailto } from "@/config/site";

export function BrandKitIntro() {
  return (
    <Split
      style={{ paddingBottom: "clamp(48px,6vw,80px)" }}
      stickers={[
        { src: "sticker-stamp", pos: "at", x: "32%", y: "30%", w: 140, r: "-9deg" },
        { src: "sticker-sachet", pos: "at", x: "70%", y: "44%", w: 130, r: "8deg" },
        { src: "sticker-receipt", pos: "at", x: "44%", y: "78%", w: 120, r: "-4deg" },
      ]}
    >
      <Label>Brand kit</Label>
      <Heading as="h1" size="d1" reveal style={{ marginTop: "24px", maxWidth: "14em" }}>
        Meet Mimi. Use her well.
      </Heading>
      <Lead style={{ marginTop: "20px" }}>
        Logos, the mascot, colours, type and words for press, partners and anyone writing about Mimi.
      </Lead>
      <div className="x-btns" style={{ marginTop: "32px" }}>
        <a className="x-btn x-btn--o" href={brandKitZip.href} download>
          Download brand kit <span className="x-mono x-bk-size">ZIP {brandKitZip.size}</span>
        </a>{" "}
        <ButtonLink href={mailto("Mimi press")} variant="ghost">
          Press contact
        </ButtonLink>
      </div>
    </Split>
  );
}
