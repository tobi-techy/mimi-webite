"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink as NavLinkSpec } from "@/features/marketing/content/nav";
import { cx } from "@/lib/cx";

type MenuLinkProps = { link: NavLinkSpec; index?: number };

/** A mobile menu row that marks itself current for its section ("/blog/x" -> "blog"). */
export function MenuLink({ link, index }: MenuLinkProps) {
  const current = usePathname().split("/")[1] ?? "";
  const on = link.key === current;
  return (
    <Link className={cx("x-ml", on && "is-on")} href={link.href} aria-current={on ? "page" : undefined}>
      {link.label}
      {index !== undefined && <span className="x-label">{String(index + 1).padStart(2, "0")}</span>}
    </Link>
  );
}
