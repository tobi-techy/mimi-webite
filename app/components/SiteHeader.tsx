"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import { PillLink } from "./Pill";
import { JOIN_HREF, NAV_LINKS } from "@/content/site";

const MENU_LINKS = [{ href: "/", label: "Home" }, ...NAV_LINKS, { href: JOIN_HREF, label: "Join the pilot" }];

function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Switch theme"
      onClick={() => {
        const root = document.documentElement;
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try {
          localStorage.setItem("mimi-theme", next);
        } catch {
          /* storage may be unavailable; the theme still applies for this page */
        }
      }}
      className="h-11 w-11 shrink-0 rounded-full border border-cream-hairline bg-transparent text-[15px] leading-none text-cream"
    >
      ◐
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [small, setSmall] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setSmall(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const page = document.getElementById("main");
    if (menuOpen) {
      root.dataset.menuOpen = "true";
      page?.setAttribute("inert", "");
    } else {
      delete root.dataset.menuOpen;
      page?.removeAttribute("inert");
    }
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      burgerRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 1000px)");
    const onDesktop = (event: MediaQueryListEvent) => event.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      delete root.dataset.menuOpen;
      page?.removeAttribute("inert");
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  const closeFromLink = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
  };

  return (
    <header className="sticky top-[10px] z-50 flex justify-center pt-3.5">
      <nav
        aria-label="Primary"
        className={`flex max-w-full items-center gap-2.5 rounded-full bg-solid pl-[18px] pr-2.5 shadow-[0_14px_30px_rgba(17,17,17,0.18)] transition-[padding,transform] duration-[220ms] ease-soft ${
          small ? "scale-[0.97] py-1.5 pl-3.5 pr-2" : "py-[9px]"
        }`}
      >
        <Link href="/" aria-label="Mimi home" className="flex shrink-0 items-center">
          <Image
            src="/brand/logo-horizontal/mimi-logo-horizontal-reverse.svg"
            alt="Mimi"
            width={534}
            height={276}
            priority
            className={`-my-1.5 -ml-1.5 w-auto transition-[height] duration-200 ${small ? "h-[38px]" : "h-11"}`}
          />
        </Link>

        <div className="ml-1.5 hidden items-center gap-1 min-[1000px]:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-[13px] py-2.5 text-[15px] text-cream transition-colors duration-200 hover:bg-cream-wash ${
                  active ? "bg-cream-track" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <PillLink href={JOIN_HREF} variant="cream" className="max-[480px]:hidden">
          Join the pilot
        </PillLink>
        <ThemeToggle />
        <button
          ref={burgerRef}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-cream px-4 text-[15px] font-medium text-solid min-[1000px]:hidden"
        >
          Menu
        </button>
      </nav>

      <div
        id="mobile-menu"
        onClick={closeFromLink}
        className={`fixed inset-0 z-[70] flex-col gap-1.5 bg-surface p-6 ${menuOpen ? "flex" : "hidden"}`}
      >
        <div className="mb-[18px] flex items-center justify-between">
          <Image
            src="/brand/logo-horizontal/mimi-logo-horizontal-primary.svg"
            alt="Mimi"
            width={534}
            height={276}
            className="menu-logo h-[30px] w-auto"
          />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="min-h-11 min-w-11 rounded-full bg-ink px-4 text-[15px] text-surface"
          >
            Close
          </button>
        </div>
        {MENU_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border-b border-hairline py-3 text-2xl leading-[1.2] tracking-[-0.03em] text-ink"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
