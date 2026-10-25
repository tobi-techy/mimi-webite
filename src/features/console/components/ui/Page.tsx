import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

/** The centred content column of a console screen: fluid up to 1080px (1200px when `wide`). */
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
