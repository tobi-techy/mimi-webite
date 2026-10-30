/**
 * v2 tick meter (from Mebius's "Saving progress" / "Sales target" cards): progress drawn as many
 * thin vertical ticks, filled ink against grey. Used for figures with a real limit: runs against
 * the plan, credit used against a limit, hours against an allowance.
 */
export function TickMeter({
  value,
  max,
  ticks = 24,
  label,
}: {
  value: number;
  max: number;
  ticks?: number;
  label: string;
}) {
  const on = Math.max(0, Math.min(ticks, Math.round((value / Math.max(1, max)) * ticks)));
  return (
    <span
      className="v2-ticks"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {Array.from({ length: ticks }, (_, i) => (
        <i key={i} className={i < on ? "is-on" : undefined} />
      ))}
    </span>
  );
}
