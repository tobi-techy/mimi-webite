import { Guarantee, stagger } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { pilotWeeks } from "@/features/marketing/content/distributors";

/** The pilot: four weeks on one route, plus the month-one guarantee. */
export function DistributorsPilot() {
  return (
    <Section>
      <Wrap>
        <Stickers items={[{ src: "sticker-goods", pos: "bl", w: 130, r: "-7deg", lazy: true }]} />
        <SectionHeader
          label="The pilot"
          title="Start with one route. Free for four weeks."
          sticker={
            <Stickers
              items={[
                { src: "sticker-keke", pos: "hd", w: 150, r: "8deg", ox: "10%", oy: "0px", lazy: true },
              ]}
            />
          }
        />
        <ol className="x-weeks x-rv x-stag">
          {pilotWeeks.map((w, i) => (
            <li key={w.when} style={stagger(i)}>
              <span className="x-mono">{w.when}</span>
              <b>{w.title}</b>
              <p>{w.body}</p>
            </li>
          ))}
        </ol>
        <Guarantee label="Guarantee">If month one finds less than it costs, month one is free.</Guarantee>
      </Wrap>
    </Section>
  );
}
