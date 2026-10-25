"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { cx } from "@/lib/cx";

type NavItemProps = {
  href: string;
  label: string;
  icon?: IconName;
  /** Small leading mark instead of an icon (a status dot), kept in the 16px icon column. */
  lead?: ReactNode;
  /** Second line (mono, muted). */
  sub?: string;
  /** Right-aligned count or time; a node renders as given (it brings its own `.c-nav__count`). */
  count?: ReactNode;
  /** Exact match only instead of section prefix. */
  exact?: boolean;
  className?: string;
};

/** One sidebar entry (`.c-nav__item`), current from the pathname. Used by every sidebar list. */
export function NavItem({ href, label, icon, lead, sub, count, exact, className }: NavItemProps) {
  const pathname = usePathname();
  const on = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cx("c-nav__item", sub !== undefined && "c-nav__item--two", className)}
      aria-current={on ? "page" : undefined}
    >
      {icon && <Icon name={icon} />}
      {lead && <span className="c-nav__lead">{lead}</span>}
      {sub !== undefined ? (
        <span className="c-nav__text">
          <span className="c-nav__label">{label}</span>
          <small className="c-nav__sub">{sub}</small>
        </span>
      ) : (
        <span className="c-nav__label">{label}</span>
      )}
      {typeof count === "number" || typeof count === "string" ? (
        <span className="c-nav__count">{count}</span>
      ) : (
        count
      )}
    </Link>
  );
}
