import { cx } from "@/lib/cx";

/**
 * Loading placeholders for live screens: same footprint as the content they stand in for, so
 * nothing jumps when the API answers. Hidden from screen readers; the region says "Loading".
 */
export function SkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cx("mc-skels", className)} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="mc-skel-row" aria-hidden="true">
          <span className="mc-skel" />
          <span className="mc-skel" style={{ maxWidth: `${70 - (i % 3) * 12}%` }} />
          <span className="mc-skel" />
        </div>
      ))}
    </div>
  );
}

/** A chat feed while the thread loads: a few helper lines and one owner bubble. */
export function SkeletonFeed() {
  return (
    <div className="mc-skels mc-skels--feed" role="status" aria-label="Loading the conversation">
      <span className="mc-skel mc-skel--short" aria-hidden="true" />
      <span className="mc-skel mc-skel--bubble mc-skel--me" aria-hidden="true" />
      <span className="mc-skel mc-skel--line" aria-hidden="true" />
      <span className="mc-skel mc-skel--block" aria-hidden="true" />
      <span className="mc-skel mc-skel--short" aria-hidden="true" />
    </div>
  );
}

/** A number-sized placeholder (KPI tiles, the shops summary line). */
export const SkeletonNum = () => <span className="mc-skel mc-skel--num" aria-hidden="true" />;
