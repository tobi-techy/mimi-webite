import { PointList } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { Heading, Label, Note } from "@/components/ui/Text";
import { distributorsGrow } from "@/features/marketing/content/distributors";

/** Beyond collections: grow sales and manage shops. */
export function DistributorsGrow() {
  return (
    <Section style={{ paddingBlock: "clamp(56px,6vw,88px)" }}>
      <Wrap>
        <Label>{distributorsGrow.label}</Label>
        <Heading size="d2" reveal>
          {distributorsGrow.title}
        </Heading>
        <div className="x-grow2 x-rv x-stag">
          {distributorsGrow.columns.map((col, i) => (
            <div key={col.title} style={{ "--si": String(i) }}>
              <h3>{col.title}</h3>
              <PointList items={col.points} label={col.title} />
            </div>
          ))}
        </div>
        <Note style={{ marginTop: 24 }}>{distributorsGrow.note}</Note>
      </Wrap>
    </Section>
  );
}
