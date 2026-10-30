"use client";

import { useEffect, useRef, useState } from "react";

type Column = { label: string; value: number; title: string };

const DEFAULT_W = 640;
const H = 180;
const PAD = { top: 8, right: 0, bottom: 24, left: 40 };
const Y_TICKS = 2;

const niceMax = (v: number): number => {
  const step = 10 ** Math.floor(Math.log10(Math.max(1, v)));
  return Math.ceil(v / step) * step;
};

/**
 * One series of totals as columns (round 2 of the usage card): a quiet axis with three hairlines,
 * square-shouldered bars with a 2px top radius, the latest period in ink and the rest in grey, and
 * a native tooltip per bar. The viewBox follows the real width so axis text stays 11px.
 */
export function ColumnChart({
  columns,
  label,
  format = (v: number) => Math.round(v).toLocaleString("en-US"),
}: {
  columns: readonly Column[];
  label: string;
  format?: (v: number) => string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [W, setW] = useState(DEFAULT_W);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e?.contentRect.width ?? 0);
      if (w > 0) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = columns.length;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(1, ...columns.map((c) => c.value)));
  const slot = plotW / Math.max(1, n);
  const barW = Math.max(6, Math.min(28, slot * 0.5));
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const base = PAD.top + plotH;
  /* label every bar while there is room for ~44px each, otherwise every other one and the last */
  const every = slot >= 44 ? 1 : Math.ceil(44 / slot);

  return (
    <svg ref={ref} className="x-chart x-cols" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
        const v = (max / Y_TICKS) * i;
        return (
          <g key={i}>
            <line className="x-grid" x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} />
            <text x={0} y={y(v) + 4} textAnchor="start">
              {format(v)}
            </text>
          </g>
        );
      })}
      {columns.map((c, i) => {
        const cx = PAD.left + slot * i + slot / 2;
        const h = Math.max(2, (c.value / max) * plotH);
        const r = Math.min(2, barW / 2);
        const x0 = cx - barW / 2;
        const top = base - h;
        const last = i === n - 1;
        const show = last ? true : i % every === 0 && n - 1 - i >= every;
        return (
          <g key={c.label} className="x-pt">
            <path
              className={last ? "x-bar is-now" : "x-bar"}
              d={`M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z`}
            >
              <title>{c.title}</title>
            </path>
            {show && (
              <text x={cx} y={H - 6} textAnchor="middle">
                {c.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
