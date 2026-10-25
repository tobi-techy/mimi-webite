import { defaultPlan, estimateSavings, type PlanId } from "@/features/marketing/content/pricing";
import { sfx } from "@/lib/sound";
import { naira } from "@/lib/dom";

/**
 * Money-saved calculator on /pricing. Recomputes on every input; the server markup already holds
 * the results for the default inputs, so it reads correctly before (and without) JS.
 */
export function initCalculator(): () => void {
  const form = document.getElementById("calcForm") as HTMLFormElement | null;
  const whyBtn = document.getElementById("calcWhyBtn");
  if (!form) return () => {};

  const num = (id: string) =>
    Math.max(0, parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value ?? "") || 0);
  const out = (id: string, v: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };

  const calc = () => {
    const planId = (document.getElementById("cPlan") as HTMLSelectElement | null)?.value as
      PlanId | undefined;
    const r = estimateSavings({
      shops: num("cShops"),
      orders: num("cOrders"),
      owed: num("cOwed"),
      bad: num("cBad"),
      alerts: num("cAlerts"),
      leak: num("cLeak"),
      plan: planId ?? defaultPlan,
    });
    const { collect: sCollect, bad: sBad, alerts: sAlerts, leak: sLeak, saved, cost, net } = r;
    out("oCollect", naira(sCollect));
    out("oBad", naira(sBad));
    out("oAlerts", naira(sAlerts));
    out("oLeak", naira(sLeak));
    out("oSaved", naira(saved));
    out("oCost", naira(cost));
    const netEl = document.getElementById("oNet");
    if (netEl) {
      netEl.textContent = (net < 0 ? "−" : "") + naira(Math.abs(net));
      netEl.classList.toggle("is-neg", net < 0);
    }
    const multEl = document.getElementById("oMult");
    if (!multEl) return;
    if (net < 0) {
      out("oMultLabel", "Verdict");
      multEl.textContent = "Not worth it at this size yet. Try the free pilot first.";
      multEl.classList.add("x-save__verdict");
    } else {
      out("oMultLabel", "Pays for itself");
      multEl.textContent = (Math.round((saved / cost) * 10) / 10).toFixed(1) + "x";
      multEl.classList.remove("x-save__verdict");
    }
  };

  const toggleWhy = () => {
    const list = document.getElementById("calcWhy");
    if (!list || !whyBtn) return;
    const open = list.hidden;
    list.hidden = !open;
    whyBtn.setAttribute("aria-expanded", String(open));
    sfx("menu", open ? "open" : "close", { emphasis: "subtle" });
  };
  const noSubmit = (e: Event) => e.preventDefault();

  form.addEventListener("input", calc);
  form.addEventListener("change", calc);
  form.addEventListener("submit", noSubmit);
  whyBtn?.addEventListener("click", toggleWhy);
  calc();

  return () => {
    form.removeEventListener("input", calc);
    form.removeEventListener("change", calc);
    form.removeEventListener("submit", noSubmit);
    whyBtn?.removeEventListener("click", toggleWhy);
  };
}
