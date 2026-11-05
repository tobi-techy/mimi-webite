import type { CSSProperties } from "react";

type Bar = { label: string; value: number; caption: string; title: string };

const W = 400;
const H = 180;
const PAD = { top: 22, right: 8, bottom: 22, left: 8 };
const GRID_LINES = 3;

/** Vertical bars with value captions (SVG, no client JS). Colours come from CSS (`.x-chart`). */
export function BarChart({ bars, label }: { bars: readonly Bar[]; label: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const plotH = H - PAD.top - PAD.bottom;
  const slot = (W - PAD.left - PAD.right) / bars.length;
  const barW = Math.min(18, slot * 0.4);
  return (
    <svg className="x-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
        const y = PAD.top + (plotH * i) / GRID_LINES;
        return <line key={i} className="x-grid" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />;
      })}
      {bars.map((b, i) => {
        const h = (b.value / max) * plotH;
        const cx = PAD.left + slot * i + slot / 2;
        const y = PAD.top + plotH - h;
        return (
          <g key={b.label} className="x-pt" style={{ "--i": i } as CSSProperties}>
            <title>{b.title}</title>
            <path
              className="x-s1"
              d={`M${cx - barW / 2},${y + h} v${-(h - 4)} q0,-4 4,-4 h${barW - 8} q4,0 4,4 v${h - 4} z`}
            />
            <text x={cx} y={y - 6} textAnchor="middle">
              {b.caption}
            </text>
            <text x={cx} y={H - 6} textAnchor="middle">
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
