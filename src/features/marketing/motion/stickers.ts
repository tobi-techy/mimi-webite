import { all, hasIntersectionObserver, prefersReducedMotion, rafThrottle } from "@/lib/dom";
import { sfx } from "@/lib/sound";

/**
 * Sticker behaviour for every `.x-st` (rendered by <Sticker>) and the home hero's `.x-k` cluster:
 * pop in on scroll, idle bob with a random tempo, drag with spring-back, scroll parallax, and
 * nudging so a sticker never pokes out of the viewport.
 */

const prepared = new WeakSet<Element>();
const draggable = new WeakSet<Element>();

/** Drag any sticker; it springs back on release. A drag never counts as a click. */
function makeDraggable(s: HTMLElement): void {
  if (draggable.has(s)) return;
  const h = s.querySelector<HTMLElement>(".x-k__drag, .x-st__d");
  if (!h) return;
  draggable.add(s);
  let sx = 0;
  let sy = 0;
  let id: number | null = null;
  let moved = false;
  h.addEventListener("pointerdown", (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    id = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    moved = false;
    try {
      h.setPointerCapture(id);
    } catch {
      /* capture is best effort */
    }
    s.classList.add("is-drag");
    sfx("stickers", "select", { theme: "bubble", emphasis: "subtle" });
  });
  h.addEventListener("pointermove", (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    s.style.setProperty("--dx", dx + "px");
    s.style.setProperty("--dy", dy + "px");
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = null;
    if (moved) sfx("stickers", "close", { theme: "bubble", emphasis: "subtle" });
    s.classList.remove("is-drag");
    s.style.setProperty("--dx", "0px");
    s.style.setProperty("--dy", "0px");
  };
  h.addEventListener("pointerup", end);
  h.addEventListener("pointercancel", end);
  h.addEventListener("click", (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  });
}

/** Keeps every visible sticker fully inside the viewport (sets --cx). */
function fit(sts: HTMLElement[]): void {
  const vw = document.documentElement.clientWidth;
  const list = sts.filter((s) => s.offsetParent);
  list.forEach((s) => s.style.setProperty("--cx", "0px"));
  list.forEach((s) => {
    const r = s.getBoundingClientRect();
    const m = 4 + r.width * 0.12;
    let c = 0;
    if (r.left < m) c = m - r.left;
    else if (r.right > vw - m) c = vw - m - r.right;
    if (c) s.style.setProperty("--cx", c.toFixed(1) + "px");
  });
}

/** Static stickers: shown in place, no pop, drag or drift. */
export function showStickers(root: HTMLElement): void {
  all(root, ".x-st").forEach((s) => s.classList.add("is-pop"));
}

/**
 * Sets up the stickers inside `root` (the whole site frame) for the current route.
 * Returns a teardown for the window listeners and observers it created.
 */
export function armStickers(root: HTMLElement): () => void {
  const reduce = prefersReducedMotion();
  const sts = all(root, ".x-st");
  const timers: number[] = [];

  sts.forEach((s) => {
    if (prepared.has(s)) return;
    prepared.add(s);
    s.style.setProperty("--d", (6 + Math.random() * 3).toFixed(1) + "s");
    s.style.setProperty("--dl", (-Math.random() * 5).toFixed(1) + "s");
  });

  // pop in as each sticker scrolls into view
  let pio: IntersectionObserver | null = null;
  const fresh = sts.filter((s) => !s.classList.contains("is-pop"));
  if (reduce || !hasIntersectionObserver()) fresh.forEach((s) => s.classList.add("is-pop"));
  else {
    pio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const t = en.target as HTMLElement;
          t.style.setProperty("--i", Math.round(Math.random() * 260) + "ms");
          t.classList.add("is-pop");
          pio?.unobserve(t);
        });
      },
      { threshold: 0.15 },
    );
    fresh.forEach((s) => pio?.observe(s));
  }

  all(root, "#khero .x-k").concat(sts).forEach(makeDraggable);

  // keep inside the viewport: now, shortly after the route renders, on resize and on load
  const doFit = () => fit(sts);
  let fitT = 0;
  const onResizeFit = () => {
    window.clearTimeout(fitT);
    fitT = window.setTimeout(doFit, 120);
  };
  doFit();
  timers.push(window.setTimeout(doFit, 40));
  window.addEventListener("resize", onResizeFit);
  window.addEventListener("load", doFit);

  // scroll parallax
  const par = rafThrottle(() => {
    const vh = window.innerHeight;
    sts.forEach((s) => {
      if (!s.offsetParent) return;
      const r = s.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const d = parseFloat(s.getAttribute("data-depth") ?? "") || 0.5;
      s.style.setProperty("--sy", (-(r.top + r.height / 2 - vh / 2) * d * 0.08).toFixed(1) + "px");
    });
  });
  if (!reduce) {
    window.addEventListener("scroll", par.request, { passive: true });
    window.addEventListener("resize", par.request);
    timers.push(window.setTimeout(par.request, 60));
    par.request();
  }

  return () => {
    pio?.disconnect();
    timers.forEach((id) => window.clearTimeout(id));
    window.clearTimeout(fitT);
    window.removeEventListener("resize", onResizeFit);
    window.removeEventListener("load", doFit);
    par.cancel();
    window.removeEventListener("scroll", par.request);
    window.removeEventListener("resize", par.request);
  };
}
