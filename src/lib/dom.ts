/** Small DOM helpers shared by the client-side behaviour modules. */

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasIntersectionObserver = (): boolean =>
  typeof window !== "undefined" && "IntersectionObserver" in window;

export function all<T extends Element = HTMLElement>(scope: ParentNode, selector: string): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}

/** The current route view (`<div data-route>`) rendered by RouteView. */
export function activeView(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-route]");
}

/** Runs `fn` at most once per animation frame. */
export function rafThrottle(fn: () => void): { request: () => void; cancel: () => void } {
  let id = 0;
  return {
    request() {
      if (!id)
        id = requestAnimationFrame(() => {
          id = 0;
          fn();
        });
    },
    cancel() {
      if (id) cancelAnimationFrame(id);
      id = 0;
    },
  };
}

/** Formats a naira amount the way each original widget did (calculator: en-NG, stories: en-US). */
export const naira = (n: number, locale: "en-NG" | "en-US" = "en-NG"): string =>
  "₦" + Math.round(n).toLocaleString(locale);
