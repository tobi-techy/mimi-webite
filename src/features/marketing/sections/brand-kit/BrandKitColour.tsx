import { CopyButton } from "@/components/ui/CopyButton";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/features/marketing/content/brand-kit";

export function BrandKitColour() {
  return (
    <Section id="bk-colour">
      <Wrap>
        <SectionHeader
          label="04 / Colour"
          title="Mostly black and white."
          lead="Warm greys do the work. Signal orange is kept for status and marks, never for decoration. Tap a swatch to copy it."
        />
        <div className="x-bk-swatches x-rv x-stag">
          {palette.map((c) => (
            <CopyButton key={c.hex} text={c.hex} label={c.hex} className="x-bk-swatch">
              <span className="x-bk-swatch__chip" style={{ background: c.hex }} />
              <b>{c.name}</b>
              <span className="x-bk-swatch__use">{c.use}</span>
            </CopyButton>
          ))}
        </div>
      </Wrap>
    </Section>
  );
}
