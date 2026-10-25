import type { ReactNode } from "react";
import { Section } from "@/components/ui/Section";
import { Stickers, type StickerSpec } from "@/components/ui/Sticker";
import { Heading, Label, Lead } from "@/components/ui/Text";
import { cx } from "@/lib/cx";

type CtaBandProps = {
  label?: string;
  title: string;
  /** d1 for the big closing bands, d2 for the smaller ones. */
  size?: "d1" | "d2";
  /** Gap between label and headline (as set inline on the original). */
  spaced?: boolean;
  lead?: ReactNode;
  /** Buttons; rendered in `.x-btns`, or inside `.x-cta__side` when `side` is used. */
  actions: ReactNode;
  /** Wrap the actions in `.x-cta__side` (with the mascot sticker or a nested button row). */
  side?: boolean;
  /** Stickers over the band (outside the content column) or inside it. */
  stickers?: readonly StickerSpec[];
  stickersInside?: boolean;
  /** Fade the two halves up on scroll (the blog post CTA reveals only its buttons). */
  reveal?: boolean;
  id?: string;
};

/** Dark closing call-to-action band (`.x-cta`). */
export function CtaBand({
  label,
  title,
  size = "d2",
  spaced = true,
  lead,
  actions,
  side,
  stickers = [],
  stickersInside,
  reveal = true,
  id,
}: CtaBandProps) {
  return (
    <Section tone="dark" className="x-cta" id={id}>
      {!stickersInside && <Stickers items={stickers} />}
      <div className="x-wrap x-cta__in">
        {stickersInside && <Stickers items={stickers} />}
        <div className={reveal ? "x-rv" : undefined}>
          {label && <Label>{label}</Label>}
          <Heading size={size} reveal style={spaced && label ? { marginTop: "20px" } : undefined}>
            {title}
          </Heading>
          {lead && <Lead>{lead}</Lead>}
        </div>
        {side ? (
          <div className={cx("x-cta__side", reveal && "x-rv")}>{actions}</div>
        ) : (
          <div className={cx("x-btns", "x-rv")}>{actions}</div>
        )}
      </div>
    </Section>
  );
}
