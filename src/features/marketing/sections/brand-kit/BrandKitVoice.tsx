import { NumberedCards } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { voiceRules } from "@/features/marketing/content/brand-kit";

export function BrandKitVoice() {
  return (
    <Section tone="cream" id="bk-voice">
      <Wrap>
        <SectionHeader label="08 / Voice" title="How Mimi sounds." />
        <NumberedCards kind="trust" items={voiceRules} />
      </Wrap>
    </Section>
  );
}
