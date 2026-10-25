import { JobCards } from "@/features/marketing/components/AgentCards";
import { DebtBookPanel } from "@/features/marketing/components/DebtBookPanel";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Stickers } from "@/components/ui/Sticker";
import { debtBookExample, shopJobs } from "@/features/marketing/content/shops";

/** Six jobs one chat does, with the debt book example. */
export function ShopsJobs() {
  return (
    <Section tone="cream" id="jobs">
      <Wrap>
        <Stickers items={[{ src: "sticker-phone", pos: "bl", w: 120, r: "-8deg", ox: "36%", lazy: true }]} />
        <SectionHeader
          label="Six jobs"
          title="One chat does the shop's paperwork."
          sticker={
            <Stickers
              items={[
                { src: "sticker-notebook", pos: "hd", w: 130, r: "9deg", ox: "14%", oy: "10px", lazy: true },
              ]}
            />
          }
        />
        <JobCards
          jobs={shopJobs}
          reveal
          style={{ borderTop: "1px solid var(--x-line)", paddingTop: "24px" }}
        />
        <DebtBookPanel data={debtBookExample} />
      </Wrap>
    </Section>
  );
}
