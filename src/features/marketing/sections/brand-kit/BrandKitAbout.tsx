import { CopyButton } from "@/components/ui/CopyButton";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { boilerplate, brandFacts } from "@/features/marketing/content/brand-kit";

const blocks = [
  { key: "One line", text: boilerplate.oneLine },
  { key: "Short", text: boilerplate.short },
  { key: "Long", text: boilerplate.long },
];

export function BrandKitAbout() {
  return (
    <Section tone="cream" id="bk-about">
      <Wrap>
        <SectionHeader
          label="01 / About"
          title="Mimi, in a few words."
          lead="Copy the description that fits your space. Please keep the name as Mimi, one word, capital M."
        />
        <div className="x-bk-about">
          <div className="x-bk-copy">
            {blocks.map((b) => (
              <div key={b.key} className="x-bk-copy__row x-rv">
                <div className="x-bk-copy__head">
                  <span className="x-label">{b.key}</span>
                  <CopyButton text={b.text} />
                </div>
                <p>{b.text}</p>
              </div>
            ))}
          </div>
          <dl className="x-bk-facts x-rv">
            {brandFacts.map((f) => (
              <div key={f.k}>
                <dt className="x-label">{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Wrap>
    </Section>
  );
}
