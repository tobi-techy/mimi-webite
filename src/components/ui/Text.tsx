import type { CSSProperties, ElementType, ReactNode } from "react";
import { W } from "@/components/ui/Words";
import { cx } from "@/lib/cx";

/** Small mono uppercase label (`.x-label`). */
export function Label({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p className={cx("x-label", className)} id={id}>
      {children}
    </p>
  );
}

type HeadingProps = {
  as?: ElementType;
  /** Display size: d1 (page hero), d2 (section), d3 (card). */
  size?: "d1" | "d2" | "d3";
  /**
   * Rises in word by word as it scrolls into view (the headline reveal). Plain strings are split
   * into words; element children (e.g. the scribble-underlined phrase) move as one piece.
   */
  reveal?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
  children: ReactNode;
};

export function Heading({ as: Tag = "h2", size, reveal, className, style, id, children }: HeadingProps) {
  return (
    <Tag className={cx(size && `x-${size}`, className, reveal && "x-hl") || undefined} style={style} id={id}>
      {reveal && typeof children === "string" ? <W>{children}</W> : children}
    </Tag>
  );
}

/** Intro paragraph (`.x-lead`). `reveal` fades it up on scroll when its block does not already. */
export function Lead({
  children,
  reveal,
  style,
}: {
  children: ReactNode;
  reveal?: boolean;
  style?: CSSProperties;
}) {
  return (
    <p className={cx("x-lead", reveal && "x-rv")} style={style}>
      {children}
    </p>
  );
}

/** Aside line with a leading dash (`.x-note`). */
export function Note({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p className="x-note" style={style}>
      {children}
    </p>
  );
}

/** "→" that nudges right on hover, preceded by a space. */
export function Arrow() {
  return (
    <>
      {" "}
      <span className="x-arr">→</span>
    </>
  );
}
