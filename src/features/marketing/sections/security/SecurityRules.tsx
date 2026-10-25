import { NumberedCards } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { securityRules } from "@/features/marketing/content/security";

export function SecurityRules() {
  return (
    <Section tone="cream" id="sec-rules">
      <Wrap>
        <SectionHeader label="01 / Four rules" title="Four rules Mimi keeps." />
        <NumberedCards kind="trust" items={securityRules} />
      </Wrap>
    </Section>
  );
}
