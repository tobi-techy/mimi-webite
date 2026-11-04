import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** A console screen's frame: the full main pane with fluid side padding, capped only on ultra-wide screens (layout-full.css). `wide` is kept for callers; every page now shares one width. */
export function Page({
  wide,
  className,
  children,
}: {
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx("c-page", wide && "c-page--wide", className)}>{children}</div>;
}
