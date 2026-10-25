import { AgentDetail } from "@/features/marketing/components/AgentDetail";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { brandAgents } from "@/features/marketing/content/brands";

export function BrandsAgents() {
  return (
    <Section>
      <Wrap>
        <Stickers items={[{ src: "sticker-keke", pos: "bl", w: 130, r: "8deg", ox: "8%", lazy: true }]} />
        <SectionHeader
          label="The agents"
          title="Five agents. All next."
          sticker={
            <Stickers
              items={[
                { src: "sticker-phone", pos: "hd", w: 100, r: "-10deg", ox: "14%", oy: "10px", lazy: true },
              ]}
            />
          }
        />
        {brandAgents.map((a, i) => (
          <AgentDetail key={a.name} agent={a} index={i} />
        ))}
      </Wrap>
    </Section>
  );
}
