import { ProblemRows } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { brandProblems } from "@/features/marketing/content/brands";

export function BrandsProblem() {
  return (
    <Section tone="cream">
      <Wrap>
        <Stickers items={[{ src: "sticker-crate", pos: "bl", w: 150, r: "-6deg", ox: "30%", lazy: true }]} />
        <SectionHeader
          label="The problem"
          title="You pay for the shelf. You can't see it."
          sticker={
            <Stickers
              items={[
                { src: "sticker-sugar", pos: "hd", w: 100, r: "9deg", ox: "20%", oy: "10px", lazy: true },
              ]}
            />
          }
        />
        <ProblemRows items={brandProblems} />
      </Wrap>
    </Section>
  );
}
