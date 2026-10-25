"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink as NavLinkSpec } from "@/features/marketing/content/nav";
import { cx } from "@/lib/cx";

/** A desktop nav link that marks itself current for its section ("/blog/x" -> "blog"). */
export function NavLink({ link }: { link: NavLinkSpec }) {
  const current = usePathname().split("/")[1] ?? "";
  const on = link.key === current;
  return (
    <Link
      className={cx("x-nl", on && "is-on")}
      href={link.href}
      data-link={link.key}
      aria-current={on ? "page" : undefined}
    >
      {link.label}
    </Link>
  );
}
