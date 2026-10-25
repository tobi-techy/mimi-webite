import { ProblemRows } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { problems } from "@/features/marketing/content/home";

/** 02 / The problem. */
export function HomeProblem() {
  return (
    <Section tone="cream">
      <Wrap>
        <Stickers
          items={[
            { src: "sticker-van", pos: "tr", w: 150, r: "8deg", oy: "-60px", lazy: true },
            { src: "sticker-pin", pos: "bl", w: 90, r: "-10deg", lazy: true },
          ]}
        />
        <SectionHeader
          label="02 / The problem"
          title="Trade runs on trust. Trust leaks."
          sticker={
            <Stickers
              items={[
                { src: "sticker-receipt", pos: "hd", w: 120, r: "9deg", ox: "18%", oy: "20px", lazy: true },
              ]}
            />
          }
        />
        <ProblemRows items={problems} />
      </Wrap>
    </Section>
  );
}
