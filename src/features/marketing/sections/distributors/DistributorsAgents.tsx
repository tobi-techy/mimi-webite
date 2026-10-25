import { AgentDetail } from "@/features/marketing/components/AgentDetail";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { distributorAgents } from "@/features/marketing/content/distributors";

/** The six distributor agents in detail. */
export function DistributorsAgents() {
  return (
    <Section>
      <Wrap>
        <Stickers
          items={[{ src: "sticker-notebook", pos: "bl", w: 120, r: "-9deg", ox: "45%", lazy: true }]}
        />
        <SectionHeader
          label="The agents"
          title="Three agents in the pilot. More when you're ready."
          sticker={
            <Stickers
              items={[
                { src: "sticker-crate", pos: "hd", w: 130, r: "9deg", ox: "12%", oy: "10px", lazy: true },
              ]}
            />
          }
        />
        {distributorAgents.map((a, i) => (
          <AgentDetail key={a.name} agent={a} index={i} />
        ))}
      </Wrap>
    </Section>
  );
}
