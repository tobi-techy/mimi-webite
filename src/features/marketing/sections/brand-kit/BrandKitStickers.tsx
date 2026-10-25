import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { StickerName } from "@/components/ui/Sticker";
import { stickersZip } from "@/features/marketing/content/brand-kit";

const names: StickerName[] = [
  "sticker-van",
  "sticker-crate",
  "sticker-cash",
  "sticker-receipt",
  "sticker-pos",
  "sticker-phone",
  "sticker-notebook",
  "sticker-stamp",
  "sticker-keke",
  "sticker-sachet",
  "sticker-sugar",
  "sticker-oil",
  "sticker-goods",
  "sticker-pin",
];

export function BrandKitStickers() {
  return (
    <Section id="bk-stickers">
      <Wrap>
        <SectionHeader
          label="06 / Stickers"
          title="The sticker set."
          lead="Die-cut objects from the route: vans, crates, receipts, POS. Use a few at a time, slightly tilted, around plain layouts."
        />
        <div className="x-bk-stickers x-rv x-stag">
          {names.map((n) => (
            <img
              key={n}
              src={`/stickers/${n}.webp`}
              alt={n.replace("sticker-", "") + " sticker"}
              loading="lazy"
            />
          ))}
        </div>
        <div className="x-btns" style={{ marginTop: "32px" }}>
          <a className="x-btn x-btn--ghost" href={stickersZip.href} download>
            Download stickers <span className="x-mono x-bk-size">PNG ZIP {stickersZip.size}</span>
          </a>
        </div>
      </Wrap>
    </Section>
  );
}
