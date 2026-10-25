"use client";

import { useEffect, useRef } from "react";
import { MimiAlive as Rig, type Mood } from "./engine";

/**
 * Mimi with a living face: sphere-mapped head turns, eyes that lead the head,
 * blinks, glances, pointer follow and spring-blended moods.
 * Holds still under prefers-reduced-motion. Styles in src/styles/mimi.css (.x-mimi-alive).
 */
export function MimiAlive({
  mood = "idle",
  follow = true,
  autonomous = true,
  className,
  size,
}: {
  mood?: Mood;
  follow?: boolean;
  autonomous?: boolean;
  className?: string;
  size?: "sm" | "xs";
}) {
  const host = useRef<HTMLSpanElement>(null);
  const rig = useRef<Rig | null>(null);

  useEffect(() => {
    if (!host.current) return;
    rig.current = new Rig(host.current, { follow, autonomous, mood });
    return () => {
      rig.current?.destroy();
      rig.current = null;
    };
    // the rig is built once; mood changes flow through setMood below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [follow, autonomous]);

  useEffect(() => {
    rig.current?.setMood(mood);
  }, [mood]);

  return (
    <span
      ref={host}
      className={["x-mimi-alive-host", size && `x-mimi-alive-host--${size}`, className].filter(Boolean).join(" ")}
    />
  );
}

export type { Mood };
