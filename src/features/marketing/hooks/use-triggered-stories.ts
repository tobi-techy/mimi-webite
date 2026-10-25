"use client";

import { useEffect } from "react";
import { armTriggeredStories } from "@/features/marketing/motion/triggered-stories";
import { activeView } from "@/lib/dom";

/** Three witnesses, debt book and brand totals play when they scroll into view. */
export function useTriggeredStories(pathname: string, enabled: boolean): void {
  useEffect(() => {
    const view = activeView();
    if (!enabled || !view) return;
    return armTriggeredStories(view);
  }, [pathname, enabled]);
}
