import { helperFaces } from "@/features/console/components/helpers/faces.generated";
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
        <g transform="translate(170 50) rotate(20) scale(0.8)" className="mc-mimi__bow" strokeWidth="6" strokeLinejoin="round">
          <path d="M0 0 C-8 -9 -20 -22 -33 -18 C-41 -15 -42 -2 -37 -1 C-42 2 -41 15 -33 17 C-21 21 -8 9 0 0Z" />
          <path d="M0 0 C8 -9 20 -22 33 -18 C41 -15 42 -2 37 -1 C42 2 41 15 33 17 C21 21 8 9 0 0Z" />
          <ellipse rx="7.5" ry="9" />
        </g>
      </g>
    </svg>
  );
}

/**
 * A helper's face (shape + colour from the helper system), or Mimi's mark. Decorative.
 * `ring` wraps it in a hairline circle (avatars in the thread).
 */
export function HelperFace({
  name,
  size = 20,
  ring,
  dot,
  busy,
  state,
  className,
}: {
  name: Exclude<Speaker, "me">;
  size?: number;
  ring?: number;
  dot?: boolean;
  /** Small green dot: this helper is working right now. */
  busy?: boolean;
  /**
   * What the helper is doing (roster, rail, helper view): working = a small spinner and a slow
   * bob, waiting = the orange dot, blocked = a hairline slash mark, done = a check, idle = quiet.
   */
  state?: FaceState;
  className?: string;
}) {
  const face =
    name === "Mimi" ? (
      <MimiMark size={size} />
    ) : (
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: helperFaces[name] }}
      />
    );
  return (
    <span
      className={cx("mc-face", !!ring && "mc-face--ring", `mc-face--${name}`, state && `mc-face--is-${state}`, className)}
      style={ring ? { width: ring, height: ring } : undefined}
      aria-hidden="true"
    >
      {face}
      {(dot || state === "waiting") && <i className="mc-face__dot" />}
      {busy && !state && <i className="mc-face__busy" />}
      {state === "working" && <i className="mc-face__st mc-face__st--working" />}
      {state === "blocked" && <i className="mc-face__st mc-face__st--blocked" />}
      {state === "done" && !dot && (
        <i className="mc-face__st mc-face__st--done">
          <svg viewBox="0 0 10 10">
            <path d="M2.6 5.2 4.3 6.8 7.4 3.4" />
          </svg>
        </i>
      )}
    </span>
  );
}
