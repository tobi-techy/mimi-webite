import type { ReactNode } from "react";

/** A neutral mono tag (`.c-chip`) for categories and labels. Status uses Pill. */
export function Chip({ children }: { children: ReactNode }) {
  return <span className="c-chip">{children}</span>;
}
