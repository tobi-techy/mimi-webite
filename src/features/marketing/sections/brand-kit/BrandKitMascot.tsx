import { MimiMoodStage } from "@/components/ui/mimi-alive/MimiMoodStage";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { mascotDo, mascotDont } from "@/features/marketing/content/brand-kit";

export function BrandKitMascot() {
  return (
    <Section tone="cream" id="bk-mascot">
      <Wrap>
        <SectionHeader
          label="03 / Mascot"
          title="Mimi herself."
          lead="One colour, a slight tilt, eyes glancing up. She shows up where she is working, never as decoration."
        />
        <div className="x-bk-mascot">
          <div className="x-bk-mascot__stage x-rv">
            <MimiMoodStage />
          </div>
          <div className="x-bk-rules x-rv x-stag">
            <div>
              <span className="x-label">Do</span>
              <ul>
                {mascotDo.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="x-label">Don&apos;t</span>
              <ul>
                {mascotDont.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
