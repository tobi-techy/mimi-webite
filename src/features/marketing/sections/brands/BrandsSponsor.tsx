import { BrandViewPanel } from "@/features/marketing/components/BrandViewPanel";
import { Guarantee, Steps } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { Stickers } from "@/components/ui/Sticker";
import { Heading, Label } from "@/components/ui/Text";
import { brandViewExample, sponsorSteps } from "@/features/marketing/content/brands";

/** How brands start: sponsor a pilot through one distributor. */
export function BrandsSponsor() {
  return (
    <Section tone="cream">
      <Wrap grid>
        <Stickers
          items={[
            { src: "sticker-stamp", pos: "tr", w: 120, r: "-9deg", ox: "10%", oy: "-56px", lazy: true },
            { src: "sticker-notebook", pos: "bl", w: 120, r: "7deg", ox: "22%", lazy: true },
          ]}
        />
        <div className="x-calc__head x-rv">
          <Label>How brands start</Label>
          <Heading size="d2" reveal>
            Sponsor a pilot through one of your distributors.
          </Heading>
          <BrandViewPanel data={brandViewExample} />
        </div>
        <div className="x-start x-rv">
          <Steps items={sponsorSteps} />
          <Guarantee
            label="Consent"
            reveal={false}
            sticker={
              <Stickers
                items={[
                  { src: "sticker-van", pos: "in", w: 120, r: "9deg", ox: "-14px", oy: "-44px", lazy: true },
                ]}
              />
            }
          >
            Data only from shops that said yes, only for your own products.
          </Guarantee>
        </div>
      </Wrap>
    </Section>
  );
}
