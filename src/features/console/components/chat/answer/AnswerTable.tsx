"use client";

import Link from "next/link";
import { EntityChip } from "@/features/console/components/chat/answer/EntityChip";
import { entityHref } from "@/features/console/components/chat/answer/Inline";
import { ScoreMeter } from "@/features/console/components/chat/answer/ScoreMeter";
import { SourceChip } from "@/features/console/components/chat/answer/SourceChip";
import { Icon } from "@/features/console/components/ui/Icon";
import { openDoc } from "@/features/console/demo/engine";
import type { Source, TableCell, TableColumn } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

function Cell({ c }: { c: TableCell }) {
  if (typeof c === "string") return <>{c}</>;
  if ("entity" in c) return <EntityChip entity={c.entity} href={c.href ?? entityHref(c.entity)} />;
  if ("score" in c) return <ScoreMeter score={c.score} />;
  if ("money" in c) return <span className={cx("mc-at__money", c.tone === "bad" && "is-bad")}>{naira(c.money)}</span>;
  if (c.href)
    return (
      <Link className="mc-at__link" href={c.href}>
        {c.link}
        <Icon name="arrow-right" />
      </Link>
    );
  if (c.docId)
    return (
      <button type="button" className="mc-at__link" onClick={() => openDoc(c.docId)}>
        {c.link}
        <Icon name="arrow-right" />
      </button>
    );
  return <span className="mc-at__link">{c.link}</span>;
}

/** A data table inside an answer: entity column with shop avatars, scores with meters, links; file chips under it. */
export function AnswerTable({ columns, rows, files, label }: { columns: TableColumn[]; rows: TableCell[][]; files?: Source[]; label?: string }) {
  return (
    <div className="mc-atw">
      <div className="mc-at" role="region" aria-label={label ?? "Table"} tabIndex={0}>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={cx(c.align === "right" && "is-r")} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={cx(columns[j]?.align === "right" && "is-r")}>
                    <Cell c={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {files?.length ? (
        <div className="mc-atw__files">
          {files.map((f) => (
            <SourceChip key={f.name} source={f} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
