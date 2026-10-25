import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type PillTone = "green" | "amber" | "red" | "muted";

/** Mono status tag (`.x-pill`). */
export function Pill({
  tone,
  className,
  children,
}: {
  tone?: PillTone;
  className?: string;
  children: ReactNode;
}) {
  return <span className={cx("x-pill", tone && `x-pill--${tone}`, className)}>{children}</span>;
}
