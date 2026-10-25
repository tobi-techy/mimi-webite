type Axis = readonly [name: string, current: number, previous: number];

const W = 360;
const H = 260;
const CX = W / 2;
const CY = 136;
const R = 92;
const RINGS = 4;
const LABEL_GAP = 14;

const point = (i: number, n: number, v: number): [number, number] => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [CX + Math.cos(a) * R * v, CY + Math.sin(a) * R * v];
};
const polygon = (values: readonly number[]) =>
  values.map((v, i) => point(i, values.length, v / 100).join(",")).join(" ");

/** Two-series radar (this month against last month) as plain SVG. */
export function RadarChart({ axes, label }: { axes: readonly Axis[]; label: string }) {
  const n = axes.length;
  const current = axes.map((a) => a[1]);
  return (
    <svg className="x-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {Array.from({ length: RINGS }, (_, r) => (
        <polygon
          key={r}
          className="x-grid"
          fill="none"
          points={polygon(axes.map(() => ((r + 1) / RINGS) * 100))}
        />
      ))}
      {axes.map(([name], i) => {
        const [x, y] = point(i, n, 1);
        const [lx, ly] = point(i, n, 1 + LABEL_GAP / R);
        const anchor = Math.abs(lx - CX) < 4 ? "middle" : lx > CX ? "start" : "end";
        return (
          <g key={name}>
            <line className="x-grid" x1={CX} y1={CY} x2={x} y2={y} />
            <text x={lx} y={ly + 4} textAnchor={anchor}>
              {name}
            </text>
          </g>
        );
      })}
      <polygon className="x-faint x-line" points={polygon(axes.map((a) => a[2]))} />
      <polygon className="x-area" points={polygon(current)} />
      <polygon className="x-s1 x-line" points={polygon(current)} />
      {axes.map(([name, cur, prev], i) => {
        const [x, y] = point(i, n, cur / 100);
        return (
          <circle key={name} className="x-dot" cx={x} cy={y} r={3}>
            <title>{`${name}: ${cur}% this month, ${prev}% last month`}</title>
          </circle>
        );
      })}
    </svg>
  );
}
