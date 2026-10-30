"use client";

import Link from "next/link";
import { EntityChip, EntityMark } from "@/features/console/components/chat/answer/EntityChip";
import { entityHref } from "@/features/console/components/chat/answer/Inline";
import { ScoreMeter } from "@/features/console/components/chat/answer/ScoreMeter";
import { SourceChip } from "@/features/console/components/chat/answer/SourceChip";
import { Icon } from "@/features/console/components/ui/Icon";
import { StatusPill } from "@/features/console/components/ui/StatusPill";
import { openDoc } from "@/features/console/demo/engine";
import type { Source, TableCell, TableColumn } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

type Obj = Exclude<TableCell, string>;
const isLink = (c: TableCell): c is Extract<Obj, { link: string }> => typeof c !== "string" && "link" in c;
const isMoney = (c: TableCell): c is Extract<Obj, { money: number }> => typeof c !== "string" && "money" in c;
const isEntity = (c: TableCell): c is Extract<Obj, { entity: unknown }> =>
  typeof c !== "string" && "entity" in c;

function Cell({ c }: { c: TableCell }) {
  if (typeof c === "string") return <>{c}</>;
  if ("entity" in c) return <EntityChip entity={c.entity} href={c.href ?? entityHref(c.entity)} />;
  if ("score" in c) return <ScoreMeter score={c.score} />;
  if ("status" in c) return <StatusPill status={c.status}>{c.text}</StatusPill>;
  if ("money" in c)
    return <span className={cx("mc-at__money", c.tone === "bad" && "is-bad")}>{naira(c.money)}</span>;
  if (c.href)
    return (
      <Link className="mc-at__link" href={c.href}>
        {c.link}
      </Link>
    );
  if (c.docId)
    return (
      <button type="button" className="mc-at__link" onClick={() => openDoc(c.docId!)}>
        {c.link}
      </button>
    );
  return <span className="mc-at__link">{c.link}</span>;
}

/** Where a row goes when tapped: its link cell (a shop page or a doc). */
function rowTarget(r: TableCell[]): { href?: string; docId?: string; label?: string } {
  const l = r.find(isLink);
  return l ? { href: l.href, docId: l.docId, label: l.link } : {};
}

function RowGo({ r, name }: { r: TableCell[]; name: string }) {
  const t = rowTarget(r);
  if (t.href)
    return (
      <Link className="v2-go" href={t.href} aria-label={`Open ${name}`}>
        <Icon name="chevron-right" />
      </Link>
    );
  if (t.docId)
    return (
      <button type="button" className="v2-go" aria-label={`Open ${name}`} onClick={() => openDoc(t.docId!)}>
        <Icon name="chevron-right" />
      </button>
    );
  return null;
}

function csv(columns: TableColumn[], rows: TableCell[][]): string {
  const text = (c: TableCell): string => {
    if (typeof c === "string") return c;
    if ("entity" in c) return c.entity.label;
    if ("score" in c) return String(c.score);
    if ("money" in c) return String(c.money);
    if ("status" in c) return c.text ?? c.status;
    return c.link;
  };
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const keep = columns.map((_, j) => !rows.every((r) => r[j] !== undefined && isLink(r[j]!)));
  return [
    columns.filter((_, j) => keep[j]).map((c) => q(c.label)),
    ...rows.map((r) => r.filter((_, j) => keep[j]).map((c) => q(text(c)))),
  ]
    .map((l) => l.join(","))
    .join("\n");
}

/**
 * v2 in-thread table card (Leye's table + Muse/Grok "artifacts are objects"): one header with title,
 * a quiet one-line summary and a CSV download (owners pass these lists to their accountant or rep), hairline rows only, numbers
 * right-aligned in tabular figures, a chevron per row instead of an "Open" column. Below 560px the
 * card switches to stacked rows (no table/list toggle: a short table never needs two views): name and amount on the first line, the rest as a quiet second
 * line, so nothing scrolls sideways on a phone.
 */
export function AnswerTable({
  columns,
  rows,
  files,
  label,
}: {
  columns: TableColumn[];
  rows: TableCell[][];
  files?: Source[];
  label?: string;
}) {
  const linkCol = columns.findIndex((_, j) => rows.every((r) => r[j] !== undefined && isLink(r[j]!)));
  const cols = columns.map((c, j) => ({ ...c, j })).filter((c) => c.j !== linkCol);
  const moneyCol = cols.find((c) => rows.every((r) => isMoney(r[c.j]!)))?.j;
  const entityCol = cols.find((c) => rows.every((r) => isEntity(r[c.j]!)))?.j ?? 0;
  const first = rows[0]?.[entityCol];
  const noun =
    first && isEntity(first)
      ? `${first.entity.kind}${rows.length === 1 ? "" : "s"}`
      : rows.length === 1
        ? "row"
        : "rows";
  const total =
    moneyCol !== undefined
      ? rows.reduce((s, r) => s + (r[moneyCol] as { money: number }).money, 0)
      : undefined;
  const sub = `${rows.length} ${noun}${total !== undefined ? ` · ${naira(total)} in all` : ""}`;
  const name = (r: TableCell[]) => {
    const c = r[entityCol];
    return c && isEntity(c) ? c.entity.label : "row";
  };

  const download = () => {
    const blob = new Blob([csv(columns, rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(label ?? "table").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="v2-card v2-tc" aria-label={label ?? "Table"}>
      <header className="v2-card__h">
        <div>
          <h4>{label ?? "Table"}</h4>
          <p>{sub}</p>
        </div>
        <div className="v2-tools">
          <button
            type="button"
            className="v2-tool"
            aria-label="Download as CSV"
            title="Download CSV"
            onClick={download}
          >
            <Icon name="download" />
          </button>
        </div>
      </header>

      <div className="v2-tc__table" role="region" aria-label={label ?? "Table"} tabIndex={0}>
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.label} className={cx(c.align === "right" && "is-r")} scope="col">
                  {c.label}
                </th>
              ))}
              {linkCol >= 0 && <th className="v2-tc__go" aria-label={columns[linkCol]!.label} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {cols.map((c) => (
                  <td key={c.j} className={cx(c.align === "right" && "is-r")}>
                    <Cell c={r[c.j]!} />
                  </td>
                ))}
                {linkCol >= 0 && (
                  <td className="v2-tc__go">
                    <RowGo r={r} name={name(r)} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="v2-tc__list">
        {rows.map((r, i) => {
          const e = r[entityCol];
          const m = moneyCol !== undefined ? r[moneyCol] : undefined;
          const rest = cols.filter((c) => c.j !== entityCol && c.j !== moneyCol);
          const t = rowTarget(r);
          const body = (
            <>
              {e && isEntity(e) && <EntityMark entity={e.entity} size={20} />}
              <span className="v2-tc__main">
                <span className="v2-tc__l1">
                  <b>{e && isEntity(e) ? e.entity.label : <Cell c={r[entityCol]!} />}</b>
                  {m && <Cell c={m} />}
                </span>
                <span className="v2-tc__l2">
                  {rest.map((c) => {
                    const cell = r[c.j]!;
                    const pill = typeof cell !== "string" && "status" in cell;
                    return (
                      <span key={c.j}>
                        {!pill && <span className="v2-tc__k">{c.label}</span>}
                        <Cell c={cell} />
                      </span>
                    );
                  })}
                </span>
              </span>
              {(t.href || t.docId) && <Icon name="chevron-right" className="i v2-tc__chev" />}
            </>
          );
          return (
            <li key={i}>
              {t.href ? (
                <Link className="v2-tc__row" href={t.href}>
                  {body}
                </Link>
              ) : t.docId ? (
                <button type="button" className="v2-tc__row" onClick={() => openDoc(t.docId!)}>
                  {body}
                </button>
              ) : (
                <div className="v2-tc__row">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {files?.length ? (
        <footer className="v2-card__f">
          <span>Based on</span>
          {files.map((f) => (
            <SourceChip key={f.name} source={f} />
          ))}
        </footer>
      ) : null}
    </section>
  );
}
