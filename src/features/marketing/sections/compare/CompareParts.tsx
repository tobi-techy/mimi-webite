import Link from "next/link";
import type { ReactNode } from "react";
import type { Cell, Comparison } from "@/features/marketing/content/compare";
import { cx } from "@/lib/cx";

/** A competitor's mark: clean text monogram in a hairline tile (no hotlinked logos). */
export function Monogram({
  text,
  size = "md",
  label,
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  return (
    <span
      className={cx("x-cmp__mono", `x-cmp__mono--${size}`)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {text}
    </span>
  );
}

/** Mimi's v8 mark (the favicon art) in the same tile size. */
export function MimiMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cx("x-cmp__mono", "x-cmp__mono--mimi", `x-cmp__mono--${size}`)}>
      <img src="/favicon.svg" alt="Mimi" width={64} height={64} />
    </span>
  );
}

const icon = {
  Yes: <path d="M3.5 8.5l3 3 6-7" />,
  Partial: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none" />
    </>
  ),
  No: <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />,
} as const;

/** A Yes / Partial / No / Not listed cell, or free text. `mark` adds a footnote number. */
export function CellValue({ value, mark }: { value: Cell | string; mark?: string }) {
  const known = value === "Yes" || value === "Partial" || value === "No";
  const kind = known ? value.toLowerCase() : value === "Not listed" ? "nl" : "text";
  return (
    <span className={cx("x-cmp__cell", `x-cmp__cell--${kind}`)}>
      {known && (
        <svg viewBox="0 0 16 16" aria-hidden="true">
          {icon[value]}
        </svg>
      )}
      <span>{value}</span>
      {mark && <sup>{mark}</sup>}
    </span>
  );
}

/** "Yes. Outlets install nothing": a leading rating word gets the cell treatment, the rest stays text. */
export function RatedText({ text }: { text: string }) {
  const m = /^(Yes|No|Partial|Not listed)(?:[.,]\s*(.*))?$/.exec(text);
  if (!m) return <span className="x-cmp__rt">{text}</span>;
  return (
    <span className="x-cmp__rt">
      <CellValue value={m[1] as Cell} />
      {m[2] && <span className="x-cmp__rt-more">{m[2].charAt(0).toUpperCase() + m[2].slice(1)}</span>}
    </span>
  );
}

/** A comparison card for the hub grid and "Keep reading". */
export function CompareCard({ c }: { c: Comparison }) {
  return (
    <Link className="x-cmp__card" href={`/compare/${c.slug}`}>
      <div className="x-cmp__card-top">
        <Monogram text={c.monogram} />
        <span className="x-cmp__vs x-label">vs</span>
        <MimiMark />
        <span className="x-arr" aria-hidden="true">
          →
        </span>
      </div>
      <h3>{c.name} vs Mimi</h3>
      <p>{c.take}</p>
      <p className="x-label x-cmp__card-meta">
        <span>{c.category}</span>
        <span>{c.price}</span>
      </p>
    </Link>
  );
}

/** Small mono line with the check date. */
export function CheckedLine({ children }: { children: ReactNode }) {
  return <p className="x-cmp__fine">{children}</p>;
}
