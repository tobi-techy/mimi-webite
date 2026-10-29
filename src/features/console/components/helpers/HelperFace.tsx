import { Helper, type HelperState } from "@/components/helpers/Helper";
import type { HelperExpression } from "@/components/helpers/rig.generated";
import type { FaceState } from "@/features/console/demo/roster";
import type { Speaker } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

/** Mimi's blob mark, drawn in the ink colour so it reads on both themes. */
function MimiMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="14 0 216 200" aria-hidden="true" className="mc-mimi">
      <g transform="rotate(-8 120 110)">
        <path
          d="M120 36c48 0 84 16 88 60 3 34-10 62-36 76-17 9-34 12-52 12s-35-3-52-12C42 158 29 130 32 96 36 52 72 36 120 36Z"
          className="mc-mimi__body"
        />
        <g transform="translate(10 -6)" className="mc-mimi__eye">
          <ellipse cx="92" cy="114" rx="9.5" ry="13" />
          <ellipse cx="148" cy="114" rx="9.5" ry="13" />
        </g>
        <g
          transform="translate(170 50) rotate(20) scale(0.8)"
          className="mc-mimi__bow"
          strokeWidth="6"
          strokeLinejoin="round"
        >
          <path d="M0 0 C-8 -9 -20 -22 -33 -18 C-41 -15 -42 -2 -37 -1 C-42 2 -41 15 -33 17 C-21 21 -8 9 0 0Z" />
          <path d="M0 0 C8 -9 20 -22 33 -18 C41 -15 42 -2 37 -1 C42 2 41 15 33 17 C21 21 8 9 0 0Z" />
          <ellipse rx="7.5" ry="9" />
        </g>
      </g>
    </svg>
  );
}

/** Below this size the rig holds still (inline labels, chips); at and above it the rig's own orange marks show. */
const STILL_BELOW = 16;
const MARKS_FROM = 40;

/** Console face state -> rig state. Pending approval wins (waiting on owner); blocked keeps its slash mark, idle pose. */
export function rigStateOf(state: FaceState | undefined, dot?: boolean, busy?: boolean): HelperState {
  if (dot || state === "waiting") return "waiting";
  if (state === "working" || (!state && busy)) return "working";
  if (state === "done") return "done";
  return "idle";
}

/**
 * A helper's face (the v6 rig: shape, motion and state from the helper system), or Mimi's mark. Decorative.
 * `ring` sizes the box (avatars in the panel and palette).
 * Small faces (under 40px) keep the console's own marks (orange needs-you dot, spinner, check); larger ones
 * use the rig's marks (orange dot = working, ring = waiting on you).
 */
export function HelperFace({
  name,
  size = 20,
  ring,
  dot,
  busy,
  state,
  expression,
  still,
  quiet,
  stagger,
  className,
}: {
  name: Exclude<Speaker, "me">;
  size?: number;
  ring?: number;
  dot?: boolean;
  /** Small green dot: this helper is working right now. */
  busy?: boolean;
  /**
   * What the helper is doing (roster, rail, helper view, thread header): working = the rig's work loop,
   * waiting = waiting on you, done = a one-off pop when the task finishes, blocked = a hairline slash, idle = quiet.
   */
  state?: FaceState;
  expression?: HelperExpression;
  /** Force a still face (no loops). */
  still?: boolean;
  /** Rig motion only: no orange marks at all, console overlay or rig (rows and headers that already say their state in words). */
  quiet?: boolean;
  /** Index in a list, so neighbouring faces don't loop in unison. */
  stagger?: number;
  className?: string;
}) {
  const rig = rigStateOf(state, dot, busy);
  const big = size >= MARKS_FROM;
  const face =
    name === "Mimi" ? (
      <MimiMark size={size} />
    ) : (
      <Helper
        name={name}
        size={size}
        state={rig}
        expression={expression}
        still={still || size < STILL_BELOW}
        marks={big && !quiet}
        stagger={stagger}
      />
    );
  return (
    <span
      className={cx(
        "mc-face",
        !!ring && "mc-face--ring",
        `mc-face--${name}`,
        state && `mc-face--is-${state}`,
        className,
      )}
      style={ring ? { width: ring, height: ring } : undefined}
      aria-hidden="true"
    >
      {face}
      {!quiet && (!big || name === "Mimi") && (
        <>
          {(dot || state === "waiting") && <i className="mc-face__dot" />}
          {busy && !state && <i className="mc-face__busy" />}
          {state === "working" && <i className="mc-face__st mc-face__st--working" />}
          {state === "done" && !dot && (
            <i className="mc-face__st mc-face__st--done">
              <svg viewBox="0 0 10 10">
                <path d="M2.6 5.2 4.3 6.8 7.4 3.4" />
              </svg>
            </i>
          )}
        </>
      )}
      {state === "blocked" && <i className="mc-face__st mc-face__st--blocked" />}
    </span>
  );
}
