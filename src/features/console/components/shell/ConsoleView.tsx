import type { ReactNode } from "react";
import { PageTransition } from "@/components/navigation/PageTransition";
import { cx } from "@/lib/cx";

/** One console screen (`.x-view`, the scrolling area inside the frame), animated on navigation. */
export function ConsoleView({
  className,
  label,
  children,
}: {
  className?: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <PageTransition>
      <section className={cx("x-view", className)} aria-label={label}>
        {children}
      </section>
    </PageTransition>
  );
}
