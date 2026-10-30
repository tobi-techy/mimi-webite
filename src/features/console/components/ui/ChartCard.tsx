"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import { cx } from "@/lib/cx";

export type ChartTable = { columns: string[]; rows: (string | number)[][]; align?: ("left" | "right")[] };
export type Legend = { label: string; tone: "s1" | "s2" | "s3" };

/**
 * v2 chart card (Leye's chart cards): one anatomy everywhere. Heading, one line of subcopy, a tiny
 * toolbar top-right (download CSV, chart/table toggle), an optional control under the heading,
 * dot legends, then the chart, or the same numbers as a table for anyone who would rather read.
 */
export function ChartCard({
  title,
  sub,
  legend,
  control,
  stats,
  table,
  filename,
  children,
  className,
}: {
  title: string;
  sub?: string;
  legend?: Legend[];
  control?: ReactNode;
  /** Mebius's two-stat header: label-over-value figures above the chart. */
  stats?: { label: string; value: string; note?: string }[];
  table: ChartTable;
  filename: string;
  children: ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
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
          <div className="v2-seg v2-seg--icons" role="group" aria-label="View">
            <button
              type="button"
              aria-pressed={view === "chart"}
              aria-label="Chart view"
              onClick={() => setView("chart")}
            >
              <Icon name="bar-chart" />
            </button>
            <button
              type="button"
              aria-pressed={view === "table"}
              aria-label="Table view"
              onClick={() => setView("table")}
            >
              <Icon name="table" />
            </button>
          </div>
        </div>
      </header>
      {stats?.length ? (
        <dl className="v2-stats v2-stats--card">
          {stats.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>
                {s.value}
                {s.note && <small>{s.note}</small>}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {control && <div className="v2-cc__ctl">{control}</div>}
      {view === "chart" ? (
        <>
          <div className="v2-cc__chart">{children}</div>
          {legend?.length ? (
            <ul className="v2-legend">
              {legend.map((l) => (
                <li key={l.label}>
                  <i className={`v2-dot v2-dot--${l.tone}`} />
                  {l.label}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="v2-cc__table" tabIndex={0} role="region" aria-label={`${title} as a table`}>
          <table>
            <thead>
              <tr>
                {table.columns.map((c, i) => (
                  <th key={c} className={cx(table.align?.[i] === "right" && "is-r")} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j} className={cx(table.align?.[j] === "right" && "is-r v2-num")}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
