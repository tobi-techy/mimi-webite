import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { brandAssets } from "@/features/marketing/content/brand-kit";
import { cx } from "@/lib/cx";

export function BrandKitLogos() {
  return (
    <Section id="bk-logos">
      <Wrap>
        <SectionHeader
          label="02 / Logo"
          title="Logo and mark."
          lead="Vector SVG for screens and print, high-resolution PNG for everything else."
        />
        <div className="x-bk-assets x-rv x-stag">
          {brandAssets.map((a) => (
            <figure key={a.name} className={cx("x-bk-asset", a.wide && "x-bk-asset--wide")}>
              <div className={cx("x-bk-asset__tile", `x-bk-asset__tile--${a.bg}`)}>
                <img src={a.preview} alt={a.name} loading="lazy" />
              </div>
              <figcaption>
                <div>
                  <b>{a.name}</b>
                  <p>{a.note}</p>
                </div>
                <div className="x-bk-dl">
                  {a.files.map((f) => (
                    <a key={f.label} href={f.href} download className="x-mono">
                      {f.label} <span aria-hidden="true">↓</span>
                    </a>
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Wrap>
    </Section>
  );
}
