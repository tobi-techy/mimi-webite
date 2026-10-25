import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type TableProps = {
  /** Accessible name for the table. */
  label?: string;
  /** Inside a card: no outer border. */
  bare?: boolean;
  /** Fits its container (no minimum width) and lets cells wrap. */
  fit?: boolean;
  className?: string;
  children: ReactNode;
};

/** The console data table: hairline rows, mono uppercase header, scrolls sideways when narrow. */
export function Table({ label, bare, fit, className, children }: TableProps) {
  return (
    <div className={cx("c-table", bare && "c-table--bare")}>
      <table className={cx("x-dt", fit && "x-dt--fit", className)} aria-label={label}>
        {children}
      </table>
    </div>
  );
}
