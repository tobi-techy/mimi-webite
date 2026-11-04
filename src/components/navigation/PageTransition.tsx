import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps one page's content so client navigations animate it (styles in src/styles/transitions.css).
 * Lives in each page, not a layout: layouts persist, so enter and exit only fire on pages.
 *
 * `kind` picks the animation class: "page" is the marketing site's top-down wipe; "console" is the
 * console's quick fade of the main pane only (the sidebar and frame never move).
 */
export function PageTransition({ kind = "page", children }: { kind?: "page" | "console"; children: ReactNode }) {
  return (
    <ViewTransition enter={kind} exit={kind} update="none" default="none">
      {children}
    </ViewTransition>
  );
}
