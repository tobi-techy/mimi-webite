import { NumberedCards } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { Stickers } from "@/components/ui/Sticker";
import { distributorsOutcomes } from "@/features/marketing/content/distributors";

/** Three outcomes: collect without chasing, no fake alerts, clean routes. */
export function DistributorsOutcomes() {
  return (
    <Section tone="cream" style={{ paddingBlock: "clamp(56px,6vw,88px)" }}>
      <Wrap>
        <Stickers
          items={[
            { src: "sticker-pos", pos: "tr", w: 120, r: "-10deg", ox: "12%", lazy: true },
            { src: "sticker-receipt", pos: "bl", w: 100, r: "8deg", ox: "30%", lazy: true },
          ]}
        />
        <NumberedCards kind="outc" items={distributorsOutcomes} />
      </Wrap>
    </Section>
  );
}
