"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CommandPalette } from "@/features/console/components/shell/CommandPalette";
import { Icon } from "@/features/console/components/ui/Icon";
import { DRAWER_BREAKPOINT, consoleRoutes } from "@/features/console/config";
import { playDemo } from "@/features/console/demo/engine";
import { hydrateDemo, useDemo } from "@/features/console/demo/store";
import { ShellContext } from "@/features/console/hooks/use-shell";
import { cx } from "@/lib/cx";
import { initSound } from "@/lib/sound";

/**
 * The console frame (`.mc-app`): sidebar (collapsible on desktop, a drawer on phones), the main
 * column, ⌘K, the demo store hydration, the sound layer and `?demo=1` autoplay.
 */
type ShellProviderProps = { sidebar: ReactNode; children: ReactNode };

const COLLAPSE_KEY = "mimi-console-side";
let autoplayed = false;

export function ShellProvider({ sidebar, children }: ShellProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const conversations = useDemo((s) => s.conversations);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  /* demo store, saved sidebar state, sound, ?demo=1 */
  useEffect(() => {
    hydrateDemo();
    try {
      // saved preference, applied after hydration so server and client markup match
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    const stop = initSound();
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") === "1" && !autoplayed) {
      autoplayed = true;
      void playDemo((href) => router.push(href));
    }
    return stop;
  }, [router]);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= DRAWER_BREAKPOINT) setDrawerOpen((o) => !o);
    else
      setCollapsed((c) => {
        try {
          localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
        } catch {
          /* ignore */
        }
        return !c;
      });
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ collapsed, drawerOpen, toggleSidebar, closeDrawer, openPalette }),
    [collapsed, drawerOpen, toggleSidebar, closeDrawer, openPalette],
  );

  /* chat routes bring their own header (with a back button on phones). Mimi's home is her thread,
     so on phones it has one top bar (the thread's, which has the menu), not two */
  const home = consoleRoutes.home.replace(/\/$/, "");
  const isChat =
    (pathname.replace(/\/$/, "") || "/") === (home || "/") ||
    pathname === `${consoleRoutes.threads}/new` ||
    conversations.some((c) => pathname === `${consoleRoutes.threads}/${c.slug}`);

  return (
    <ShellContext value={value}>
      <div className={cx("mc-app", collapsed && "is-collapsed", drawerOpen && "is-drawer-open", isChat && "is-chat")}>
        {sidebar}
        <div className="mc-scrim" aria-hidden="true" onClick={closeDrawer} />
        <main className="mc-main" id="main">
          <div className="mc-mtop">
            <button className="mc-ib" type="button" aria-label="Open menu" onClick={toggleSidebar}>
              <Icon name="menu" />
            </button>
            <span className="mc-mtop__logo">
              <img className="x-lock x-lock--rev" src="/brand/mimi-logo-horizontal-reverse.svg" alt="Mimi" />
              <img className="x-lock x-lock--ink" src="/brand/mimi-logo-horizontal-ink.svg" alt="" />
            </span>
            <button className="mc-ib" type="button" aria-label="Search" onClick={openPalette}>
              <Icon name="search" />
            </button>
          </div>
          {children}
        </main>
      </div>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </ShellContext>
  );
}
