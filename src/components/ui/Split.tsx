import type { CSSProperties, ReactNode } from "react";
import { Section, Wrap } from "@/components/ui/Section";
import { Stickers, type StickerSpec } from "@/components/ui/Sticker";
import { cx } from "@/lib/cx";

type SplitProps = {
  tone?: "plain" | "cream" | "dark";
  className?: string;
  id?: string;
  style?: CSSProperties;
  /** Fade the text column up on scroll. */
  reveal?: boolean;
  /** Text column content. */
  children: ReactNode;
  /** Decorative sticker cluster in the second column. */
  stickers: readonly StickerSpec[];
  /** Override the element and class of the text column (the home quote uses a blockquote). */
  textAs?: "div" | "blockquote";
  /** Extra art drawn in the sticker column, under the stickers (the 404 mascot). */
  aside?: ReactNode;
};

/** Two-column band: text on the left, a sticker cluster on the right (`.x-split__a` / `.x-split__b`). */
export function Split({
  tone,
  className,
  id,
  style,
  reveal,
  children,
  stickers,
  textAs = "div",
  aside,
}: SplitProps) {
  const Text = textAs;
  return (
    <Section tone={tone} className={className} id={id} style={style}>
      <Wrap grid>
        <Text className={cx(textAs === "div" && "x-split__a", reveal && "x-rv") || undefined}>
          {children}
        </Text>
        <div className="x-split__b" aria-hidden="true">
          {aside}
          <Stickers items={stickers} trail={false} />
        </div>
      </Wrap>
    </Section>
  );
}
