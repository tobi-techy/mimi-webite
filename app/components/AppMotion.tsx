"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Arms the entrance and scroll-reveal animations. Elements opt in with
 * `data-reveal` (fade + rise) or `data-drop` (sticker fall); the observer adds
 * `data-in` once they are in view. Re-runs on route change so freshly
 * navigated pages animate too. With reduced motion everything shows at once.
 */
export function AppMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal],[data-drop]"));
    if (!elements.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      elements.forEach((element) => element.setAttribute("data-in", ""));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-in", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    elements.forEach((element) => {
      element.removeAttribute("data-in");
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
