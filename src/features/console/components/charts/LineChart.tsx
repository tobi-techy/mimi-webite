type Point = { label: string; primary: number; secondary: number; title: string };

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 24, left: 40 };
const Y_TICKS = 4;
const X_LABELS = 6;
const SMOOTH = 1 / 6;

/** Catmull-Rom through the points, as cubic Bézier segments. */
function smoothPath(pts: ReadonlyArray<readonly [number, number]>): string {
  return pts
    .map((p, i) => {
      if (i === 0) return `M${p[0]},${p[1]}`;
      const p0 = pts[i - 2] ?? pts[i - 1] ?? p;
      const p1 = pts[i - 1] ?? p;
      const p2 = p;
      const p3 = pts[i + 1] ?? p;
      const c1 = [p1[0] + (p2[0] - p0[0]) * SMOOTH, p1[1] + (p2[1] - p0[1]) * SMOOTH];
      const c2 = [p2[0] - (p3[0] - p1[0]) * SMOOTH, p2[1] - (p3[1] - p1[1]) * SMOOTH];
      return `C${c1.join(",")} ${c2.join(",")} ${p2[0]},${p2[1]}`;
    })
    .join(" ");
}

const niceMax = (v: number): number => {
  const step = 10 ** Math.floor(Math.log10(Math.max(1, v)));
  return Math.ceil(v / step) * step;
};

/**
 * Two lines over time as plain SVG: the primary series on the left axis with a soft area, the
 * secondary on its own hidden scale. Each point has a hover column with a native tooltip.
 */
export function LineChart({
  points,
  label,
  format = (v: number) => Math.round(v).toLocaleString("en-US"),
  area = true,
}: {
  points: readonly Point[];
  label: string;
  /** Y-axis tick text (v2 chart cards pass a short naira format). */
  format?: (v: number) => string;
  /** The soft fill under the primary line (v2 cards turn it off: thin lines only). */
  area?: boolean;
}) {
  const n = points.length;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const maxP = niceMax(Math.max(...points.map((p) => p.primary)));
  const maxS = Math.max(1, ...points.map((p) => p.secondary)) * 1.1;
  const x = (i: number) => PAD.left + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yP = (v: number) => PAD.top + plotH - (v / maxP) * plotH;
  const yS = (v: number) => PAD.top + plotH - (v / maxS) * plotH;
  const primary = points.map((p, i) => [x(i), yP(p.primary)] as const);
  const secondary = points.map((p, i) => [x(i), yS(p.secondary)] as const);
  const line = smoothPath(primary);
  const base = PAD.top + plotH;
  const every = Math.max(1, Math.ceil(n / X_LABELS));
  const col = n > 1 ? plotW / (n - 1) : plotW;

  return (
    <svg className="x-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
        const v = (maxP / Y_TICKS) * i;
        const y = yP(v);
        return (
          <g key={i}>
            <line className="x-grid" x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end">
              {format(v)}
            </text>
          </g>
        );
      })}
      {points.map((p, i) =>
        i % every === 0 || i === n - 1 ? (
          <text
            key={p.label}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          >
            {p.label}
          </text>
        ) : null,
      )}
      {area && <path className="x-area" d={`${line} L${x(n - 1)},${base} L${x(0)},${base} Z`} />}
      <path className="x-s1 x-line" d={line} />
      <path className="x-s2 x-line" d={smoothPath(secondary)} />
      {points.map((p, i) => (
        <g key={p.label} className="x-pt">
          <line className="x-cursor" x1={x(i)} x2={x(i)} y1={PAD.top} y2={base} />
          <rect className="x-hit" x={x(i) - col / 2} y={PAD.top} width={col} height={plotH}>
            <title>{p.title}</title>
          </rect>
        </g>
      ))}
    </svg>
  );
}
