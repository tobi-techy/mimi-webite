import type { ReactNode } from "react";

/** A sidebar list (`.c-nav`) with an optional mono caption. */
export function NavGroup({ label, title, children }: { label: string; title?: string; children: ReactNode }) {
  return (
    <nav className="c-nav" aria-label={label}>
      {title && <p className="c-nav__cap">{title}</p>}
      {children}
    </nav>
  );
}
