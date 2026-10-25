import { all, hasIntersectionObserver, naira, prefersReducedMotion } from "@/lib/dom";

/**
 * Triggered story moments: the three witnesses (Pending -> Verified, fake alert flagged), the shop
 * debt book counting down, and brand rows folding into area totals. Each plays once it scrolls
 * into view; `x-a[data-t]` elements switch on after `t` ms and `[data-count]` outputs tween.
 *
 * The markup holds each story's final state. Start states apply only once a story is armed here
 * (`.is-armed`), so no JS and reduced motion both show the final state. Transform + opacity only.
 */

type Story = HTMLElement & { _t?: number[]; _raf?: number };

export function armTriggeredStories(view: ParentNode): () => void {
  const html = document.documentElement;
  if (!html.classList.contains("motion-ready") || !hasIntersectionObserver() || prefersReducedMotion()) {
    return () => {};
  }
  const stories = all<Story>(view, "[data-story]");
  if (!stories.length) return () => {};

  const clear = (st: Story) => {
    (st._t ?? []).forEach((id) => window.clearTimeout(id));
    st._t = [];
    if (st._raf) cancelAnimationFrame(st._raf);
    st._raf = 0;
  };
  const later = (st: Story, ms: number, fn: () => void) => {
    (st._t ??= []).push(window.setTimeout(fn, ms));
  };
  const tween = (st: Story, o: HTMLElement, from: number, to: number) => {
    let t0 = 0;
    const dur = 280;
    const step = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      o.textContent = naira(from + (to - from) * p, "en-US");
      if (p < 1) st._raf = requestAnimationFrame(step);
    };
    st._raf = requestAnimationFrame(step);
  };

  // triggered stories: each element with data-t switches on that many ms after the story enters view
  const play = (st: Story) => {
    all(st, ".x-a[data-t]").forEach((e) => {
      later(st, Number(e.getAttribute("data-t")), () => e.classList.add("is-on"));
    });
    all(st, "[data-count]").forEach((o) => {
      let prev = Number(o.getAttribute("data-from"));
      (o.getAttribute("data-count") ?? "").split(",").forEach((pair) => {
        const [at, to] = pair.split(":").map(Number) as [number, number];
        const from = prev;
        later(st, at, () => tween(st, o, from, to));
        prev = to;
      });
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        play(en.target as Story);
      });
    },
    { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
  );

  const arm = (st: Story) => {
    clear(st);
    io.unobserve(st);
    st.classList.add("is-reset", "is-armed");
    all(st, ".x-a").forEach((e) => e.classList.remove("is-on"));
    all(st, "[data-count]").forEach((o) => {
      o.textContent = naira(Number(o.getAttribute("data-from")), "en-US");
    });
    void st.offsetWidth;
    st.classList.remove("is-reset");
    io.observe(st);
  };

  // each route visit replays the stories in the view that opened
  stories.forEach(arm);

  return () => {
    stories.forEach(clear);
    io.disconnect();
  };
}
