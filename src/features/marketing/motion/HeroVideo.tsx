"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/dom";

const VIDEO_SRC = "/media/hero-home.mp4";
const POSTER_SRC = "/media/hero-home-poster.webp";

type NetworkInfo = { saveData?: boolean };

/** Reduced motion, Save-Data or prefers-reduced-data: keep the still poster, load no video. */
function shouldStayStill(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  return (
    prefersReducedMotion() ||
    connection?.saveData === true ||
    window.matchMedia("(prefers-reduced-data: reduce)").matches
  );
}

/**
 * The home hero's looping video. The server renders only the poster; the video source is attached
 * on mount when motion and data allow, so reduced-motion and data-saving visitors never download it.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v || shouldStayStill()) return;
    v.muted = true;
    v.src = VIDEO_SRC;
    v.play()?.catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={POSTER_SRC}
      aria-label="A morning on the route, Lagos"
    />
  );
}
