import { ViewTransition, type ReactNode } from "react";

/**
 * Wraps one page's content so client navigations animate it (styles in src/styles/transitions.css).
 * Lives in each page, not a layout: layouts persist, so enter and exit only fire on pages.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" update="none" default="none">
      {children}
    </ViewTransition>
  );
}
