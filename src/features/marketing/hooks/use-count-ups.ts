"use client";

import { useEffect } from "react";
import { armCountUps } from "@/features/marketing/motion/count-up";
import { activeView } from "@/lib/dom";

/** Plan prices and the money-saved results count up the first time they are seen. */
export function useCountUps(pathname: string, enabled: boolean): void {
  useEffect(() => {
    const view = activeView();
    if (!enabled || !view) return;
    return armCountUps(view);
  }, [pathname, enabled]);
}
