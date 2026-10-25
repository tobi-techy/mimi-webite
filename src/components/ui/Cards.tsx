import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/lib/cx";

/** Stagger index for the children of a revealed group (`.x-stag`). */
export const stagger = (i: number): CSSProperties => ({ "--si": String(Math.min(i, 6)) });

export type NumberedItem = { title: ReactNode; body?: ReactNode };

/**
 * A group of numbered cards that reveal one after another: outcomes (`x-outc`) or trust rules
 * (`x-trust`).
 */
export function NumberedCards({ kind, items }: { kind: "outc" | "trust"; items: readonly NumberedItem[] }) {
  return (
    <div className={`x-${kind} x-rv x-stag`}>
      {items.map((it, i) => (
        <div key={i} style={stagger(i)}>
          <span className="x-label">{String(i + 1).padStart(2, "0")}</span>
          <h3>{it.title}</h3>
          {it.body && <p>{it.body}</p>}
        </div>
      ))}
    </div>
  );
}

/** "01 / heading / text" rows of the problem lists. */
export function ProblemRows({ items }: { items: readonly NumberedItem[] }) {
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} className="x-grid x-prob x-rv">
          <span className="x-prob__n">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="x-d3">{it.title}</h3>
          {it.body && <p>{it.body}</p>}
        </div>
      ))}
    </div>
  );
}

/** Numbered steps (`.x-steps`): bold lead-in and a line of detail. */
export function Steps({
  items,
  className,
  itemClassName,
}: {
  items: readonly NumberedItem[];
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ol className={cx("x-steps", className)}>
      {items.map((it, i) => (
        <li key={i} className={itemClassName}>
          <span className="x-label">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <b>{it.title}</b>
            {it.body && <p>{it.body}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Numbered bold points with optional detail (`.x-wlist`). */
export function PointList({ items, label }: { items: readonly NumberedItem[]; label?: string }) {
  return (
    <ul className="x-wlist" aria-label={label}>
      {items.map((it, i) => (
        <li key={i}>
          <span className="x-label">{String(i + 1).padStart(2, "0")}</span>
          <b>{it.title}</b>
          {it.body && <p>{it.body}</p>}
        </li>
      ))}
    </ul>
  );
}

/** A highlighted promise box (`.x-guarantee`). */
export function Guarantee({
  label,
  children,
  reveal = true,
  sticker,
  className,
  id,
  statusMessage,
}: {
  label: string;
  children: ReactNode;
  reveal?: boolean;
  sticker?: ReactNode;
  className?: string;
  id?: string;
  /** A hidden confirmation that a form reveals and focuses after submit. */
  statusMessage?: boolean;
}) {
  return (
    <div
      className={cx("x-guarantee", className, reveal && "x-rv")}
      id={id}
      {...(statusMessage ? { role: "status", tabIndex: -1, hidden: true } : {})}
    >
      {sticker}
      <span className="x-label">{label}</span> <p className="x-d3">{children}</p>
    </div>
  );
}
