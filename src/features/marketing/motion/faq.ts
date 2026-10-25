import { all, prefersReducedMotion } from "@/lib/dom";
import { sfx } from "@/lib/sound";

const wired = new WeakSet<Element>();

/** FAQ accordions open and close with a smooth height animation (native <details> otherwise). */
export function armFaq(scope: ParentNode): void {
  const reduce = prefersReducedMotion();
  all<HTMLDetailsElement>(scope, ".x-faq details").forEach((d) => {
    if (wired.has(d)) return;
    wired.add(d);
    const s = d.querySelector<HTMLElement>("summary");
    if (!s) return;
    let anim: Animation | null = null;
    s.addEventListener("click", (e) => {
      sfx("menu", d.open ? "close" : "open", { emphasis: "subtle" });
      if (reduce || !d.animate) return;
      e.preventDefault();
      anim?.cancel();
      const start = d.offsetHeight;
      const closing = d.open;
      let end: number;
      if (closing) end = s.offsetHeight + (d.offsetHeight - d.clientHeight);
      else {
        d.open = true;
        end = d.offsetHeight;
      }
      const a = d.animate(
        { height: [start + "px", end + "px"] },
        { duration: 200, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      );
      anim = a;
      a.onfinish = () => {
        anim = null;
        if (closing) d.open = false;
      };
    });
  });
}
