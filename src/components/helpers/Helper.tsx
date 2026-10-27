"use client";

import { useId, useState, type CSSProperties } from "react";
import {
  expressionMarkup,
  helperKeys,
  helperLook,
  lookExpressions,
  mimiMarkup,
  rigMarkup,
  STAGGER_MS,
  type HelperExpression,
  type HelperKey,
} from "@/components/helpers/rig.generated";
import { cx } from "@/lib/cx";
import "@/components/helpers/helpers.css";

/** What a helper is doing. Orange marks: a dot while working, a ring while waiting on the owner. */
export type HelperState = "idle" | "working" | "waiting" | "done";

export type HelperName = HelperKey | Capitalize<HelperKey>;

export const isHelperKey = (v: string): v is HelperKey =>
  (helperKeys as readonly string[]).includes(v.toLowerCase());

/**
 * One of Mimi's six helpers (v6 rig: Order, Collector, Credit, Stock, Brand, Proof), drawn in one colour
 * (the text colour by default) with its cuts painted in the surface colour (`--h-surface`, else `--bg`).
 * Motion is CSS only (helpers.css, generated from the same tracks as the motion sheet): idle breathes and
 * blinks, working hops, waiting sways with the eyes up, done pops once. A face that is already done when
 * it mounts does not pop; it pops when it becomes done (or stops working). `still` drops all motion
 * (tiny inline faces); prefers-reduced-motion always does.
 */
export function Helper({
  name,
  state = "idle",
  expression,
  size = 24,
  still,
  marks = true,
  stagger = 0,
  label,
  className,
  style,
}: {
  name: HelperName;
  state?: HelperState;
  /** One of the 12 shared eye expressions; defaults to idle eyes (happy when done). */
  expression?: HelperExpression;
  size?: number;
  still?: boolean;
  /** Show the orange status marks (dot / ring). */
  marks?: boolean;
  /** Index in a row: offsets the loops so a lineup never moves in unison. */
  stagger?: number;
  /** Accessible name; without it the face is decorative. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const key = name.toLowerCase() as HelperKey;
  const id = `h${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  /* done pops only on a transition (render-time derive, no effect): working -> idle also reads as done */
  const [seen, setSeen] = useState<{ prev: HelperState; popped: boolean; finished: boolean }>({
    prev: state,
    popped: false,
    finished: false,
  });
  if (seen.prev !== state) {
    const finished = seen.prev === "working" && state === "idle";
    setSeen({ prev: state, popped: seen.popped || state === "done" || finished, finished });
  }
  const shown: HelperState = seen.finished && state === "idle" ? "done" : state;
  const settled = shown === "done" && !seen.popped;

  const expr = expression ?? (shown === "done" ? "happy" : "idle");
  const look = lookExpressions.includes(expr) ? helperLook[key] : ([0, 0] as const);
  const html = rigMarkup[key]
    .replace("__LOOK__", `translate(${look[0]} ${look[1]})`)
    .replace("__EXPR__", expressionMarkup[expr])
    .replaceAll("__ID__", id);

  return (
    <svg
      className={cx("mimi-helper", still && "is-still", settled && "is-settled", className)}
      viewBox="0 0 240 240"
      width={size}
      height={size}
      data-helper={key}
      data-state={shown}
      data-expr={expr}
      data-marks={marks ? undefined : "off"}
      style={{ ...style, ["--stagger" as string]: `-${stagger * STAGGER_MS}ms` }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Mimi herself (v8 mark, v6 solid bow), on the same 240 box and baseline as the helpers. Static. */
export function MimiHelperMark({
  size = 24,
  label,
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <svg
      className={cx("mimi-helper", "is-still", className)}
      viewBox="0 0 240 240"
      width={size}
      height={size}
      data-helper="mimi"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: mimiMarkup }}
    />
  );
}
