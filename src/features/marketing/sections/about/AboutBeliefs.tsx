import { NumberedCards } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { beliefs } from "@/features/marketing/content/about";

export function AboutBeliefs() {
  return (
    <Section id="about-beliefs" style={{ paddingBlock: "clamp(56px,6vw,88px)" }}>
      <Wrap>
        <SectionHeader label="02 / What we believe" title="What we believe." />
        <NumberedCards kind="outc" items={beliefs} />
      </Wrap>
    </Section>
  );
}
