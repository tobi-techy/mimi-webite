import type { ReactNode } from "react";
import { Heading, Label, Lead, Note } from "@/components/ui/Text";
import { cx } from "@/lib/cx";

type SectionHeaderProps = {
  label: ReactNode;
  title: string;
  /** Short aside under the title ("— Pick your lane."). */
  note?: string;
  lead?: ReactNode;
  /** Sticker(s) pinned to the header. */
  sticker?: ReactNode;
  as?: "h1" | "h2";
  size?: "d1" | "d2";
  /** Fade the header up as one block (default) instead of revealing its parts. */
  reveal?: boolean;
};

/** Section heading block (`.x-sechead`): label, display headline, optional note or lead. */
export function SectionHeader({
  label,
  title,
  note,
  lead,
  sticker,
  as = "h2",
  size = "d2",
  reveal = true,
}: SectionHeaderProps) {
  return (
    <div className={cx("x-sechead", reveal && "x-rv")}>
      {sticker}
      <Label>{label}</Label>
      <Heading as={as} size={size} reveal>
        {title}
      </Heading>
      {note && <Note>{note}</Note>}
      {lead && <Lead reveal={!reveal}>{lead}</Lead>}
    </div>
  );
}
