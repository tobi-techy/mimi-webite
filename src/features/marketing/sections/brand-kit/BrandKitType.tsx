import { TextLink } from "@/components/ui/Button";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function BrandKitType() {
  return (
    <Section tone="cream" id="bk-type">
      <Wrap>
        <SectionHeader
          label="06 / Type"
          title="Geist and Geist Mono."
          lead="Geist Regular for everything people read. Geist Mono, small and uppercase, for labels."
        />
        <div className="x-bk-type x-rv x-stag">
          <div>
            <span className="x-label">Geist 400</span>
            <p className="x-bk-type__sans">The route, the shop, the money. One book.</p>
            <p className="x-bk-type__abc">Aa Bb Cc 0123456789 ₦</p>
          </div>
          <div>
            <span className="x-label">Geist Mono 400</span>
            <p className="x-bk-type__mono">03 / VERIFIED · ₦48,500</p>
            <p className="x-bk-type__abc x-mono">Aa Bb Cc 0123456789 ₦</p>
          </div>
        </div>
        <p className="x-fine" style={{ marginTop: "24px" }}>
          Both are free and open source.{" "}
          <TextLink href="https://github.com/vercel/geist-font" external arrow>
            Get Geist
          </TextLink>
        </p>
      </Wrap>
    </Section>
  );
}
