import { AgentCards } from "@/features/marketing/components/AgentCards";
import { stagger } from "@/components/ui/Cards";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { agentGroups } from "@/features/marketing/content/home";

/** 04 / Meet the agents: distributor and brand agents with their availability. */
export function HomeAgents() {
  return (
    <Section id="agents">
      <Wrap>
        <Stickers items={[{ src: "sticker-cash", pos: "bl", w: 130, r: "-8deg", ox: "120px", lazy: true }]} />
        <SectionHeader
          label="04 / Meet the agents"
          title="A small team that never sleeps on WhatsApp."
          note="They never clock off."
          sticker={
            <Stickers
              items={[
                { src: "sticker-phone", pos: "hd", w: 100, r: "12deg", ox: "12%", oy: "16px", lazy: true },
              ]}
            />
          }
        />
        {agentGroups.map((g) => (
          <div key={g.title} className="x-agroup x-rv x-stag">
            <div className="x-agroup__head" style={stagger(0)}>
              <span className="x-mono">{g.title}</span>
              <span className="x-label">{g.count}</span>
            </div>
            <AgentCards agents={g.agents} style={stagger(1)} />
          </div>
        ))}
      </Wrap>
    </Section>
  );
}
