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
