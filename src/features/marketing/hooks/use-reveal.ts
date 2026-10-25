"use client";

import { useEffect } from "react";
import { createReveal } from "@/features/marketing/motion/reveal";
import { activeView, all } from "@/lib/dom";
import { REARM_EVENT } from "@/features/marketing/motion/rearm";

/** Blocks fade up 14px and headlines rise line by line as they enter the viewport. */
export function useReveal(pathname: string, enabled: boolean): void {
  useEffect(() => {
    const view = activeView();
    const footerEls = all(document, ".x-rv, .x-hl").filter((e) => !e.closest("[data-route]"));
    if (!enabled) {
      all(document, ".x-rv, .x-hl, .x-ph").forEach((e) => e.classList.add("is-in"));
      return;
    }
    const reveal = createReveal();
    reveal.observe(footerEls);
    if (view) reveal.arm(view);
    const onRearm = (e: Event) => {
      const scope = (e as CustomEvent<ParentNode>).detail;
      if (scope) reveal.arm(scope);
    };
    window.addEventListener(REARM_EVENT, onRearm);
    return () => {
      window.removeEventListener(REARM_EVENT, onRearm);
      reveal.destroy();
    };
  }, [pathname, enabled]);
}
