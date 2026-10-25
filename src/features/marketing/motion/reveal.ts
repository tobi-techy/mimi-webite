import { all, hasIntersectionObserver, prefersReducedMotion } from "@/lib/dom";

/**
 * Scroll reveals: blocks fade up 14px (360ms, 70ms stagger) and headlines rise in line by line.
 * The `.x-rv` / `.x-hl` / `.x-stag` classes are in the server markup; this only flips `is-in`.
 */
type Reveal = {
  /** (Re)start the reveals inside `scope`; called on every route change and blog filter. */
  arm(scope: ParentNode): void;
  /** Watch elements that live outside the routed view (the footer) once. */
  observe(els: Element[]): void;
  destroy(): void;
};

/** Gives each headline word its line index (`--li`) so lines stagger rather than words. */
function lines(h: Element): void {
  let top: number | null = null;
  let li = -1;
  all<HTMLElement>(h, ".x-w").forEach((w) => {
    if (w.parentNode !== h) return;
    const t = w.offsetTop;
    if (top === null || t > top + 4) {
      li++;
      top = t;
    }
    w.style.setProperty("--li", String(li));
  });
}

export function createReveal(): Reveal {
  const html = document.documentElement;
  const timers = new Set<number>();
  const io =
    !prefersReducedMotion() && hasIntersectionObserver()
      ? new IntersectionObserver(
          (entries) => {
            const hits = entries.filter((en) => en.isIntersecting).map((en) => en.target as HTMLElement);
            hits.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
            let k = 0;
            hits.forEach((t) => {
              io?.unobserve(t);
              if (t.classList.contains("x-hl")) lines(t);
              else {
                t.style.setProperty("--mo-d", Math.min(k++, 5) * 70 + "ms");
                const id = window.setTimeout(() => {
                  timers.delete(id);
                  t.style.removeProperty("--mo-d");
                }, 900);
                timers.add(id);
              }
              t.classList.add("is-in");
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
        )
      : null;

  return {
    arm(scope) {
      const els = all(scope, ".x-rv, .x-hl");
      if (!io) {
        // reduced motion or no IntersectionObserver: show everything, photos included
        els.concat(all(scope, ".x-ph")).forEach((e) => e.classList.add("is-in"));
        return;
      }
      html.classList.add("mo-reset");
      els.forEach((e) => {
        e.classList.remove("is-in");
        e.style.removeProperty("--mo-d");
      });
      void (scope as HTMLElement).offsetWidth;
      html.classList.remove("mo-reset");
      els.forEach((e) => {
        io.unobserve(e);
        io.observe(e);
      });
    },
    observe(els) {
      els.forEach((e) => (io ? io.observe(e) : e.classList.add("is-in")));
    },
    destroy() {
      io?.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
    },
  };
}
