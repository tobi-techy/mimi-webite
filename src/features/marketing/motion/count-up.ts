import { all, hasIntersectionObserver, prefersReducedMotion } from "@/lib/dom";

/**
 * Counts the first number inside `el` up from 0 (ease-out cubic). Returns a stop function that
 * snaps the text back to its final value.
 */
function countUp(el: Element, dur: number): () => void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let tn: Text | null = null;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (/\d/.test(n.nodeValue ?? "")) {
      tn = n as Text;
      break;
    }
  }
  if (!tn) return () => {};
  const node = tn;
  const txt = node.nodeValue ?? "";
  const m = /(\d[\d,]*)(\.\d+)?/.exec(txt);
  if (!m) return () => {};
  const pre = txt.slice(0, m.index);
  const post = txt.slice(m.index + m[0].length);
  const whole = m[1] ?? "";
  const dec = m[2] ? m[2].length - 1 : 0;
  const comma = whole.includes(",");
  const target = parseFloat((whole + (m[2] ?? "")).replace(/,/g, ""));
  let t0 = 0;
  let raf = 0;
  let stopped = false;
  const fmt = (v: number) =>
    dec ? v.toFixed(dec) : comma ? Math.round(v).toLocaleString("en-US") : String(Math.round(v));
  const step = (t: number) => {
    if (stopped) return;
    if (!t0) t0 = t;
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    node.nodeValue = p < 1 ? pre + fmt(target * e) + post : txt;
    if (p < 1) raf = requestAnimationFrame(step);
  };
  node.nodeValue = pre + fmt(0) + post;
  raf = requestAnimationFrame(step);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    if (node.parentNode) node.nodeValue = txt;
  };
}

const CALC_OUTPUTS = ["oSaved", "oCollect", "oBad", "oAlerts", "oLeak", "oCost", "oNet", "oMult"];

/**
 * Plan prices count up as they scroll into view; the money-saved calculator's results count up
 * together the first time the panel is seen. Any edit to the calculator stops the count-up.
 */
export function armCountUps(scope: ParentNode): () => void {
  if (prefersReducedMotion() || !hasIntersectionObserver()) return () => {};
  const save = scope.querySelector<HTMLElement>("#calcForm .x-save");
  const calcForm = scope.querySelector<HTMLFormElement>("#calcForm");
  let calcStops: Array<() => void> = [];
  const timers: number[] = [];
  const stops: Array<() => void> = [];

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (en.target === save && save) {
          save.setAttribute("aria-busy", "true");
          calcStops = CALC_OUTPUTS.map((id) => {
            const o = document.getElementById(id);
            return o ? countUp(o, 700) : () => {};
          });
          timers.push(window.setTimeout(() => save.removeAttribute("aria-busy"), 760));
        } else stops.push(countUp(en.target, 600));
      });
    },
    { threshold: 0.4 },
  );
  all(scope, ".x-plan__price").forEach((p) => io.observe(p));
  if (save) io.observe(save);

  // live updates win: the calculator has already written the new figures
  const stopCalc = () => {
    calcStops.forEach((s) => s());
    calcStops = [];
    save?.removeAttribute("aria-busy");
  };
  calcForm?.addEventListener("input", stopCalc);
  calcForm?.addEventListener("change", stopCalc);

  return () => {
    io.disconnect();
    timers.forEach((id) => window.clearTimeout(id));
    calcForm?.removeEventListener("input", stopCalc);
    calcForm?.removeEventListener("change", stopCalc);
    calcStops.forEach((s) => s());
    stops.forEach((s) => s());
  };
}
