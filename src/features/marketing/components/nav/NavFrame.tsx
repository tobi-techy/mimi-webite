"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NavStateContext } from "@/features/marketing/components/nav/nav-state";
import { useScrolledPast } from "@/features/marketing/hooks/use-scrolled-past";
import { motionConfig } from "@/config/motion";
import { cx } from "@/lib/cx";

const MOBILE_BREAKPOINT = 860;
const HAIRLINE_OFFSET = 24;

/**
 * The nav's interactive shell: hairline after scrolling, mobile menu state, Escape and resize
 * handling, closing on route change. The links themselves are server-rendered children.
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
    // lock the page behind the open menu (html + body so iOS Safari stops scrolling too)
    const root = document.documentElement;
    root.classList.add("x-menu-open");
    // a tap outside the menu closes it and is swallowed (no slap sticker, no stray link)
    const onOutside = (e: MouseEvent) => {
      const nav = document.getElementById("nav");
      if (!nav || nav.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    };
    // any menu link closes the menu, even one for the page already showing
    const onMenuLink = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("#mmenu a")) setOpen(false);
    };
    document.addEventListener("click", onOutside, true);
    document.addEventListener("click", onMenuLink);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      document.getElementById("burger")?.focus();
    };
    const onResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.classList.remove("x-menu-open");
      document.removeEventListener("click", onOutside, true);
      document.removeEventListener("click", onMenuLink);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
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
