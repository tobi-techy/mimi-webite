import { cx } from "@/lib/cx";

type Segment<T extends string> = { value: T; label: string; count?: number };

type SegmentedProps<T extends string> = {
  label: string;
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Filter tabs with counts (`.x-seg`). */
export function Segmented<T extends string>({ label, segments, value, onChange }: SegmentedProps<T>) {
  return (
    <span className="x-seg" role="group" aria-label={label}>
      {segments.map((s) => (
        <button
          key={s.value}
          type="button"
          aria-pressed={s.value === value}
          className={cx(s.value === value && "is-on")}
          onClick={() => onChange(s.value)}
        >
          {s.label}
          {s.count !== undefined && (
            <>
              {" "}
              <span className="x-tm">{s.count}</span>
            </>
          )}
        </button>
      ))}
    </span>
  );
}
