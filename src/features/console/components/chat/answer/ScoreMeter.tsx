import { cx } from "@/lib/cx";

/** Below this a score reads as risk (orange blocks); at or above it the blocks stay ink. */
export const LOW_SCORE = 60;

/** Number + a segmented 6-block meter. Low scores mark in orange; good ones stay neutral. */
export function ScoreMeter({ score, max = 100, blocks = 6 }: { score: number; max?: number; blocks?: number }) {
  const on = Math.max(score > 0 ? 1 : 0, Math.min(blocks, Math.round((score / max) * blocks)));
  const low = score < (LOW_SCORE / 100) * max;
  return (
    <span className={cx("mc-score", low && "is-low")} role="img" aria-label={`Score ${score} of ${max}${low ? ", at risk" : ""}`}>
      <span className="mc-score__n">{score}</span>
      <span className="mc-score__m" aria-hidden="true">
        {Array.from({ length: blocks }, (_, i) => (
          <i key={i} className={cx(i < on && "is-on")} />
        ))}
      </span>
    </span>
  );
}
