import { NumberedCards } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { trustRules } from "@/features/marketing/content/home";

/** 05 / Trust: built so shops say yes. */
export function HomeShopsSayYes() {
  return (
    <Section>
      <Wrap>
        <Stickers
          items={[
            { src: "sticker-sugar", pos: "tr", w: 100, r: "9deg", oy: "-40px", lazy: true },
            { src: "sticker-keke", pos: "bl", w: 150, r: "-6deg", lazy: true },
          ]}
        />
        <SectionHeader
          label="05 / Trust"
          title="Built so shops say yes."
          sticker={
            <Stickers
              items={[
                { src: "sticker-notebook", pos: "hd", w: 120, r: "-9deg", ox: "22%", oy: "10px", lazy: true },
              ]}
            />
          }
        />
        <NumberedCards kind="trust" items={trustRules} />
        <div className="x-ndpa x-rv">
          <span className="x-mono">NDPA aligned</span>
          <span className="x-note">Your data is yours.</span>
        </div>
      </Wrap>
    </Section>
  );
}
