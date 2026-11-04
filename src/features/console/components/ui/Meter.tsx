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

/**
 * A 0 to 100 score as the number and 11 ticks (Rico's table spec, 4 Nov 2026): filled ticks in ink,
 * empty ones in a dark grey. Neutral on purpose: orange is the status colour and is not used here.
 */
export function ScoreTicks({ score }: { score: number }) {
  const on = Math.max(0, Math.min(11, Math.round((score * 11) / 100)));
  return (
    <span className="x-score" role="img" aria-label={`${score} out of 100`}>
      <span className="x-score__n" aria-hidden="true">
        {score}
      </span>
      <span className="x-score__t" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <i key={i} className={i < on ? "is-on" : undefined} />
        ))}
      </span>
    </span>
  );
}
