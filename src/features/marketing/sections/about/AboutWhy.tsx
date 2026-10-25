import { SectionHeader } from "@/components/ui/SectionHeader";
import { Split } from "@/components/ui/Split";
import { Lead } from "@/components/ui/Text";
import { aboutWhy, aboutWhySticker } from "@/features/marketing/content/about";

/** 01 / Why Mimi: the copy on the left, the notebook sticker in its own column on the right. */
export function AboutWhy() {
  return (
    <Split tone="cream" id="about-why" className="x-split--solo" stickers={[aboutWhySticker]}>
      <SectionHeader label="01 / Why Mimi" title="One book that all three can trust." />
      <div className="x-rv x-stack">
        {aboutWhy.map((p) => (
          <Lead key={p}>{p}</Lead>
        ))}
      </div>
    </Split>
  );
}
