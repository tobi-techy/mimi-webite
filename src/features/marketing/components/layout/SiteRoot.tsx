"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const AUTH_ROUTES = new Set(["/signup", "/login"]);

/** The page frame element (`#top.x-site`). Signup and login hide the site chrome via `.is-signup`. */
export function SiteRoot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className={cx("page x-site", AUTH_ROUTES.has(pathname) && "is-signup")} id="top">
      {children}
    </div>
  );
}
