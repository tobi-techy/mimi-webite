import { Section, Wrap } from "@/components/ui/Section";
import { Heading, Label, Note } from "@/components/ui/Text";
import { logos } from "@/features/marketing/content/logos";
import { worksWith } from "@/features/marketing/content/works-with";

/** Logo strip: the tools Mimi works with, drawn monochrome in currentColor. */
export function WorksWith({ tone = "plain" }: { tone?: "plain" | "cream" }) {
  return (
    <Section tone={tone} style={{ paddingBlock: "clamp(56px,6vw,88px)" }}>
      <Wrap>
        <Label>{worksWith.label}</Label>
        <Heading size="d2" reveal>
          {worksWith.title}
        </Heading>
        {worksWith.groups.map((group) => (
          <div key={group.caption} className="x-works">
            <p className="x-label x-works__cap">{group.caption}</p>
            <ul className="x-works__grid x-rv x-stag">
              {group.ids.map((id, i) => (
                <li key={id} style={{ "--si": String(Math.min(i, 6)) }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d={logos[id].path} />
                  </svg>
                  <span>{logos[id].name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Note style={{ marginTop: 24 }}>{worksWith.note}</Note>
      </Wrap>
    </Section>
  );
}
