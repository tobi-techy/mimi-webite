/** Three-step level meter (`.x-meter`), used for model speed and autonomy. */
export function Meter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="x-meter" data-l={level} aria-hidden="true">
      <i></i>
      <i></i>
      <i></i>
    </span>
  );
}

/** Thin fill bar (`.x-mb`) for percentages in tables. */
export function MiniBar({ percent }: { percent: number }) {
  return (
    <span className="x-mb" aria-hidden="true">
      <i style={{ width: `${Math.min(100, percent)}%` }}></i>
    </span>
  );
}
