"use client";

import { useEffect } from "react";
import { createParallax } from "@/features/marketing/motion/parallax";
import { activeView } from "@/lib/dom";

/** Hero video, blog photo, page-hero photos and the hero sticker cluster drift on scroll. */
export function usePhotoParallax(pathname: string, enabled: boolean): void {
  useEffect(() => {
    const view = activeView();
    if (!enabled || !view) return;
    const parallax = createParallax();
    parallax.collect(view);
    return () => parallax.destroy();
  }, [pathname, enabled]);
}
