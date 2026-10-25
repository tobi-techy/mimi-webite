import { DEFAULT_THEME, THEME_REVEAL_MS, THEME_STORAGE_KEY, type Theme } from "@/config/theme";
import { prefersReducedMotion } from "@/lib/dom";

export function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : DEFAULT_THEME;
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage blocked: the choice lasts this visit */
  }
}

/** Re-render whenever the data-theme attribute on <html> changes. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/**
 * Switch theme with a circular reveal that grows from `origin` (the toggle button).
 * The swap happens inside one View Transition snapshot, so no element runs its own colour
 * transition (`html.is-theme-switching` turns those off). Unsupported browsers and
 * reduced-motion users get an instant swap.
 */
export function switchTheme(next: Theme, origin?: { x: number; y: number }): void {
  const doc = document;
  if (!doc.startViewTransition || prefersReducedMotion()) {
    applyTheme(next);
    return;
  }
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 0;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const root = doc.documentElement;
  root.classList.add("is-theme-switching");
  const transition = doc.startViewTransition(() => applyTheme(next));
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: THEME_REVEAL_MS,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  transition.finished.finally(() => root.classList.remove("is-theme-switching"));
}
