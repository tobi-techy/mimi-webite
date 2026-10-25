import type { StatItem } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

/** Rounded-bar sparkline. Bars from `markFrom` on are marked (orange only on bad cards). */
export function Sparkline({ values, markFrom, tone }: { values: number[]; markFrom?: number; tone?: StatItem["tone"] }) {
  const max = Math.max(...values, 1);
  return (
    <span className="mc-sparkl" aria-hidden="true">
      {values.map((v, i) => (
        <i
          key={i}
          className={cx(markFrom !== undefined && i >= markFrom && (tone === "bad" ? "is-bad" : "is-mark"))}
          style={{ height: `${Math.max(12, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </span>
  );
}

/** Stat cards side by side: label, big number, mono delta (orange when bad), sparkline. */
export function StatCards({ items }: { items: StatItem[] }) {
  return (
    <div className="mc-stats" role="list">
      {items.map((s) => (
        <div key={s.label} className={cx("mc-stat", `is-${s.tone ?? "flat"}`)} role="listitem">
          <p className="mc-stat__l">{s.label}</p>
          <p className="mc-stat__v">
            <span className="mc-stat__n">{s.value}</span>
            {s.delta && <span className="mc-stat__d">{s.delta}</span>}
          </p>
          {s.spark && s.spark.length > 1 && <Sparkline values={s.spark} markFrom={s.markFrom} tone={s.tone} />}
          {s.caption && <p className="mc-stat__c">{s.caption}</p>}
        </div>
      ))}
    </div>
  );
}
