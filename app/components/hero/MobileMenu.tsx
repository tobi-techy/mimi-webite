"use client";

import { useEffect, useRef } from "react";
import { CtaButton } from "./CtaButton";
import { NAV_LINKS } from "./navigation";
import styles from "./MobileMenu.module.css";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  return (
    <div className={styles.menu} id="mobile-menu" data-open={open || undefined} inert={!open}>
      <nav className={styles.links} aria-label="Mobile">
        {NAV_LINKS.map((link, i) => (
          <a
            key={link.href}
            ref={i === 0 ? firstLinkRef : undefined}
            href={link.href}
            onClick={onClose}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <CtaButton className={styles.cta} onClick={onClose}>
        Get started
      </CtaButton>
    </div>
  );
}
