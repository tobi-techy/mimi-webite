import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HelpersStage } from "@/features/marketing/sections/brand-kit/HelpersStage";
import { helperDo } from "@/features/marketing/content/brand-kit";

/** Mimi's six helpers: the live rig (states, expressions, signature moves) and downloads. */
export function BrandKitHelpers() {
  return (
    <Section id="bk-helpers">
      <Wrap>
        <SectionHeader
          label="04 / Helpers"
          title="Mimi and her six helpers."
          lead="One chunky shape each, one bright colour, a Nigerian cue in the outline and one move of their own. Their eyes and one orange mark say what they are doing."
        />
        <HelpersStage />
        <div className="x-bk-hrules x-rv">
          <span className="x-label">Rules</span>
          <ul>
            {helperDo.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </Wrap>
    </Section>
  );
}
