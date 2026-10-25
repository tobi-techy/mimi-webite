"use client";

import { useEffect } from "react";
import { armStickers, showStickers } from "@/features/marketing/motion/stickers";

/** Stickers pop in, bob, drag with spring-back, drift on scroll and stay inside the viewport. */
export function useStickers(pathname: string, enabled: boolean): void {
  useEffect(() => {
    const site = document.getElementById("top");
    if (!site) return;
    if (!enabled) {
      showStickers(site);
      return;
    }
    return armStickers(site);
  }, [pathname, enabled]);
}
