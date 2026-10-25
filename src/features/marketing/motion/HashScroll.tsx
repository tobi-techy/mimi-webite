"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/dom";

/** Scrolls so the target sits just below the sticky nav. */
function scrollToId(id: string, smooth: boolean): boolean {
  const target = id && document.getElementById(id);
  if (!target) return false;
  const nav = document.getElementById("nav");
  requestAnimationFrame(() => {
    const y = target.getBoundingClientRect().top + window.scrollY - (nav?.offsetHeight ?? 0);
    window.scrollTo({ top: y, behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
    // a focusable target (the skip link's <main>) also takes keyboard focus
    if (target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
  });
  return true;
}

/**
 * In-page anchors (/#witnesses, /terms#t-data, /shops#jobs): jump below the sticky nav when a page
 * opens on a hash, and scroll smoothly when the link points into the page already open.
 */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href*='#']");
      if (!(a instanceof HTMLAnchorElement) || a.target) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!document.getElementById(id)) return;
      e.preventDefault();
      if (location.hash !== url.hash) history.pushState(history.state, "", url.hash);
      scrollToId(id, true);
    };
    // capture phase, so this runs before next/link handles the click
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // a page that opens on a hash lands with the target below the nav
  useEffect(() => {
    if (location.hash) scrollToId(decodeURIComponent(location.hash.slice(1)), false);
  }, [pathname]);

  return null;
}
