"use client";

import type { ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import { cx } from "@/lib/cx";

export type ChartTable = { columns: string[]; rows: (string | number)[][] };

/**
 * Chart card, round 2 (Leye's chart cards, fewer parts): heading and one quiet line, a single
 * download button top-right (owners hand these numbers to their accountant), the one figure the
 * chart adds up to, an optional control, then the chart. No legend for a single series and no
 * chart/table toggle: the CSV is the table.
 */
export function ChartCard({
  title,
  sub,
  figure,
  control,
  table,
  filename,
  children,
  className,
}: {
  title: string;
  sub?: string;
  /** The total the chart adds up to, shown large under the heading. */
  figure?: string;
  control?: ReactNode;
  /** What the download writes. */
  table: ChartTable;
  filename: string;
  children: ReactNode;
  className?: string;
}) {
  const download = () => {
    const q = (v: string | number) =>
      typeof v === "string" && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : String(v);
    const text = [table.columns, ...table.rows].map((r) => r.map(q).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <section className={cx("v2-card v2-cc", className)} aria-label={title}>
      <header className="v2-card__h">
        <div>
          <h4>{title}</h4>
          {sub && <p>{sub}</p>}
        </div>
        <div className="v2-tools">
          <button
            type="button"
            className="v2-tool"
            aria-label={`Download ${title} as CSV`}
            title="Download CSV"
            onClick={download}
          >
            <Icon name="download" />
          </button>
        </div>
      </header>
      {figure && <p className="v2-cc__fig v2-num">{figure}</p>}
      {control && <div className="v2-cc__ctl">{control}</div>}
      <div className="v2-cc__chart">{children}</div>
    </section>
  );
}
