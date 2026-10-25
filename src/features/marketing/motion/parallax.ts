import { all, prefersReducedMotion, rafThrottle } from "@/lib/dom";

type Item = { el: HTMLElement; box: HTMLElement; f?: number; s?: number; max?: number; rate?: number };

/**
 * Photo and hero parallax (wide screens only, never under reduced motion). Uses the individual
 * `translate`/`scale` properties via --py, so existing transforms stay intact.
 * - hero video and blog post photo: slight zoom + drift
 * - page hero photos: gentle drift (max 24px)
 * - home hero stickers: rise at different rates as the hero scrolls away (max 72px)
 */
export function createParallax(): { collect(scope: ParentNode): void; destroy(): void } {
  const html = document.documentElement;
  const reduce = prefersReducedMotion();
  let items: Item[] = [];
  let on = false;

  const setPar = () => {
    const next = !reduce && window.innerWidth >= 768;
    if (next !== on) {
      on = next;
      html.classList.toggle("mo-par", on);
      if (!on) items.forEach((it) => it.el.style.removeProperty("--py"));
    }
  };

  const frame = rafThrottle(() => {
    if (!on) return;
    const vh = window.innerHeight;
    const reads: Array<[HTMLElement, number]> = [];
    items.forEach((it) => {
      if (!it.box.offsetParent && it.box !== document.body) return;
      const r = it.box.getBoundingClientRect();
      if (r.height === 0 || r.bottom < -100 || r.top > vh + 100) return;
      let v: number;
      if (it.rate) v = Math.max(-(it.max ?? 0), Math.min(0, r.top * it.rate));
      else {
        const lim = it.s ? ((it.s - 1) / 2) * r.height - 1 : (it.max ?? 0);
        v = Math.max(-lim, Math.min(lim, (vh / 2 - (r.top + r.height / 2)) * (it.f ?? 0)));
      }
      reads.push([it.el, v]);
    });
    reads.forEach(([el, v]) => el.style.setProperty("--py", v.toFixed(1) + "px"));
  });

  const onResize = () => {
    setPar();
    frame.request();
  };
  window.addEventListener("scroll", frame.request, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  setPar();

  return {
    collect(scope) {
      items = [];
      [
        scope.querySelector<HTMLElement>(".x-khero__vid video"),
        scope.querySelector<HTMLElement>("#postImg img"),
      ].forEach((el) => {
        if (!el?.parentElement) return;
        el.classList.add("x-par");
        items.push({ el, box: el.parentElement, f: 0.2, s: 1.1 });
      });
      all(scope, ".x-dhero__img").forEach((b) => {
        b.classList.add("x-drift");
        items.push({ el: b, box: b, f: 0.06, max: 24 });
      });
      const hero = scope.querySelector<HTMLElement>("#khero");
      if (hero)
        all(hero, ".x-k").forEach((k, i) => {
          k.classList.add("x-drift");
          items.push({ el: k, box: hero, rate: 0.05 + (i % 4) * 0.03, max: 72 });
        });
      frame.request();
    },
    destroy() {
      frame.cancel();
      window.removeEventListener("scroll", frame.request);
      window.removeEventListener("resize", onResize);
      html.classList.remove("mo-par");
    },
  };
}
