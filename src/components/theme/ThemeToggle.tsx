"use client";

import type { MouseEvent } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cx } from "@/lib/cx";
import { switchTheme } from "@/lib/theme";
import { sfx } from "@/lib/sound";

/**
 * Dark/light switch used by both shells. Both icons are rendered and CSS shows the right one
 * (src/styles/theme.css), so the server markup never mismatches the saved theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    sfx("theme", "toggle", { direction: theme === "dark" ? "forward" : "back" });
    switchTheme(theme === "dark" ? "light" : "dark", { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  return (
    <button
      className={cx("theme-toggle", className)}
      type="button"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
    >
      <svg className="theme-toggle__sun" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
      </svg>
      <svg className="theme-toggle__moon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" />
      </svg>
    </button>
  );
}
