import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";

type SectionProps = {
  /** Background band: plain canvas, cream band, or dark band. */
  tone?: "plain" | "cream" | "dark";
  /** Clips stickers that overhang the band edges. */
  clip?: boolean;
  /** Extra layout classes (x-cta, x-how, x-con ...). Pass `bare` to drop the default `x-sec` spacing. */
  className?: string;
  bare?: boolean;
  id?: string;
  style?: CSSProperties;
  "aria-labelledby"?: string;
  "data-story"?: string;
  children: ReactNode;
};

/** A full-width page band (`.x-sec`). */
export function Section({ tone = "plain", clip, className, bare, children, ...rest }: SectionProps) {
  return (
    <section
      className={cx(
        !bare && "x-sec",
        tone === "cream" && "x-sec--cream",
        tone === "dark" && "x-dark",
        clip && "x-clip",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

/** The centred content column (`.x-wrap`), optionally on the 12-column grid. */
export function Wrap({
  grid,
  className,
  children,
}: {
  grid?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx("x-wrap", grid && "x-grid", className)}>{children}</div>;
}
