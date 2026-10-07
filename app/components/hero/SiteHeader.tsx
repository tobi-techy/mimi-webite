"use client";

import { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { CtaButton } from "./CtaButton";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { NAV_LINKS } from "./navigation";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (menuOpen) root.dataset.menuOpen = "true";
    else delete root.dataset.menuOpen;
    if (!menuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      burgerRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 760px)");
    const onDesktop = (event: MediaQueryListEvent) => event.matches && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      delete root.dataset.menuOpen;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <>
      <header className={styles.header} data-hero-header data-open={menuOpen || undefined}>
        <Brand />
        <nav className={styles.nav} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          <CtaButton size="small" className={styles.cta}>
            Get started
          </CtaButton>
          <button
            ref={burgerRef}
            className={styles.burger}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={toggleMenu}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
