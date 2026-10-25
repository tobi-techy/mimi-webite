"use client";

import { useEffect } from "react";
import { armFaq } from "@/features/marketing/motion/faq";
import { activeView } from "@/lib/dom";

/** FAQ answers open and close with a smooth height animation. */
export function useFaqAccordion(pathname: string, enabled: boolean): void {
  useEffect(() => {
    const view = activeView();
    if (enabled && view) armFaq(view);
  }, [pathname, enabled]);
}
