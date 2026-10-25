"use client";

import { useEffect, useState } from "react";
import { rafThrottle } from "@/lib/dom";

/** True once the page has scrolled past `offset` px. Always true when `enabled` is false. */
export function useScrolledPast(offset: number, enabled: boolean): boolean {
  const [past, setPast] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    const frame = rafThrottle(() =>
      setPast((window.pageYOffset || document.documentElement.scrollTop) > offset),
    );
    frame.request();
    window.addEventListener("scroll", frame.request, { passive: true });
    window.addEventListener("resize", frame.request, { passive: true });
    return () => {
      frame.cancel();
      window.removeEventListener("scroll", frame.request);
      window.removeEventListener("resize", frame.request);
    };
  }, [offset, enabled]);
  return past;
}
