"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NavStateContext } from "@/features/marketing/components/nav/nav-state";
import { useScrolledPast } from "@/features/marketing/hooks/use-scrolled-past";
import { motionConfig } from "@/config/motion";
import { cx } from "@/lib/cx";

const MOBILE_BREAKPOINT = 860;
const HAIRLINE_OFFSET = 24;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Locks page scroll behind the open menu without moving the page.
 *
 * Only `<html>` gets `overflow: hidden`, which applies to the viewport. `<body>` must stay
 * overflow-visible: hiding it too makes body its own (unscrolled) scroll container, so the sticky
 * nav sticks to body instead of the viewport and jumps off-screen on a scrolled page. That was the
 * iOS bug (menu "inline among the content", header gone). Touch scrolling outside the menu is
 * also blocked for older iOS, which ignores overflow on the root, and the scroll position is put
 * back on unlock if the browser moved it anyway.
 */
function lockPage(nav: HTMLElement): () => void {
  const root = document.documentElement;
  const y = window.scrollY;
  const path = window.location.pathname;
  const scrollbar = window.innerWidth - root.clientWidth;
  // the sheet starts under the nav bar (the rename banner above the nav may still be on screen)
  nav.style.setProperty("--x-menu-top", `${Math.max(0, Math.round(nav.getBoundingClientRect().bottom))}px`);
  if (scrollbar > 0) root.style.setProperty("--x-sbw", `${scrollbar}px`);
  root.classList.add("x-menu-open");

  // everything outside the nav goes inert: no focus, no taps, hidden from assistive tech
  const outside = Array.from(nav.parentElement?.children ?? []).filter(
    (el): el is HTMLElement => el !== nav && el instanceof HTMLElement && !el.inert,
  );
  outside.forEach((el) => (el.inert = true));

  const menu = document.getElementById("mmenu");
  const onTouchMove = (e: TouchEvent) => {
    if (menu && menu.contains(e.target as Node) && menu.scrollHeight > menu.clientHeight) return;
    if (e.cancelable) e.preventDefault();
  };
  document.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    document.removeEventListener("touchmove", onTouchMove);
    outside.forEach((el) => (el.inert = false));
    root.classList.remove("x-menu-open");
    root.style.removeProperty("--x-sbw");
    // a link to another page lets the router scroll; otherwise stay exactly where the page was
    if (window.location.pathname === path && Math.abs(window.scrollY - y) > 1) {
      window.scrollTo({ top: y, behavior: "instant" });
    }
  };
}

/**
 * The nav's interactive shell: hairline after scrolling, mobile menu state, scroll lock, focus
 * trap, Escape and resize handling, closing on route change. The links are server-rendered children.
 */
export function NavFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scrolled = useScrolledPast(HAIRLINE_OFFSET, motionConfig.navHairline);
  const [open, setOpen] = useState(false);

  // close the menu on every route change
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const nav = document.getElementById("nav");
    if (!nav) return;
    const unlock = lockPage(nav);

    // any menu link closes the menu, even one for the page already showing
    const onMenuLink = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("#mmenu a")) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        document.getElementById("burger")?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      // focus trap: cycle through the nav bar controls and the menu links
      const items = Array.from(nav.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !nav.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !nav.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setOpen(false);
    };
    nav.addEventListener("click", onMenuLink);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      nav.removeEventListener("click", onMenuLink);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      unlock();
    };
  }, [open]);

  return (
    <NavStateContext value={{ open, toggle: () => setOpen((o) => !o) }}>
      <header className={cx("x-nav", scrolled && "is-scrolled", open && "is-open")} id="nav">
        {children}
      </header>
    </NavStateContext>
  );
}
