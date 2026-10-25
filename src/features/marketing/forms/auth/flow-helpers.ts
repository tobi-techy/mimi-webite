/** Shared pieces of the signup and login prototypes: field errors, busy buttons, OTP boxes, resend timer. */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Dir = "fwd" | "back";

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

/** Shows (or clears) the message under a field and marks it invalid. Returns true when valid. */
export function setError(el: HTMLElement, msg: string): boolean {
  const f = el.closest(".x-su__f");
  const p = f?.querySelector(".x-su__err");
  if (p) p.textContent = msg || "";
  el.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}

/** Puts a button into (or out of) its spinner state with a new label. */
export function setBusy(btn: HTMLButtonElement, on: boolean, label: string): void {
  btn.disabled = on;
  btn.setAttribute("aria-busy", on ? "true" : "false");
  const spin = btn.querySelector<HTMLElement>(".x-su__spin");
  if (spin) spin.hidden = !on;
  const g = btn.querySelector<SVGElement>(".x-su__g");
  if (g) g.style.display = on ? "none" : "";
  const lbl = btn.querySelector("[data-lbl]");
  if (lbl) lbl.textContent = label;
}

/** Switches the visible step panel, plays the slide animation and moves focus. */
export function showPanel(
  root: HTMLElement,
  panels: Record<string, HTMLElement>,
  key: string,
  dir: Dir | null,
  focusTarget: HTMLElement | null | undefined,
  reduce: boolean,
): void {
  const p = panels[key];
  if (!p) return;
  Object.values(panels).forEach((el) => {
    el.hidden = el !== p;
    el.classList.remove("is-fwd", "is-back");
  });
  if (!reduce && dir) {
    void p.offsetWidth;
    p.classList.add(dir === "back" ? "is-back" : "is-fwd");
  }
  if (focusTarget === undefined) return;
  (focusTarget ?? p.querySelector<HTMLElement>(".x-su__h"))?.focus({ preventScroll: true });
  const top = root.querySelector(".x-su__form")?.getBoundingClientRect().top ?? 0;
  if (top < 0) window.scrollTo(0, Math.max(0, window.scrollY + top - 24));
}

/** Six single-digit boxes: typing advances, backspace goes back, arrows move, paste fills all six. */
export function wireOtp(boxes: HTMLInputElement[], onEdit: () => void, signal: AbortSignal): void {
  const fill = (start: number, str: string) => {
    const d = str.replace(/\D/g, "").slice(0, 6 - start);
    for (let i = 0; i < d.length; i++) {
      const b = boxes[start + i];
      if (b) b.value = d[i] ?? "";
    }
    boxes[Math.min(start + d.length, 5)]?.focus();
  };
  boxes.forEach((b, i) => {
    b.addEventListener(
      "input",
      () => {
        const d = b.value.replace(/\D/g, "");
        onEdit();
        if (d.length > 1) {
          b.value = "";
          fill(d.length === 6 ? 0 : i, d);
          return;
        }
        b.value = d;
        if (d && i < 5) boxes[i + 1]?.focus();
      },
      { signal },
    );
    b.addEventListener(
      "keydown",
      (e) => {
        const prev = boxes[i - 1];
        const next = boxes[i + 1];
        if (e.key === "Backspace" && !b.value && prev) {
          e.preventDefault();
          prev.value = "";
          prev.focus();
        } else if (e.key === "ArrowLeft" && prev) {
          e.preventDefault();
          prev.focus();
        } else if (e.key === "ArrowRight" && next) {
          e.preventDefault();
          next.focus();
        }
      },
      { signal },
    );
    b.addEventListener(
      "paste",
      (e) => {
        const t = e.clipboardData?.getData("text");
        if (t && /\d/.test(t)) {
          e.preventDefault();
          boxes.forEach((x) => (x.value = ""));
          fill(0, t);
        }
      },
      { signal },
    );
    b.addEventListener("focus", () => b.select(), { signal });
  });
}

export const otpCode = (boxes: HTMLInputElement[]): string => boxes.map((b) => b.value).join("");

/** "Resend code in 30s", then a Resend button. */
export function resendTimer(wait: HTMLElement, resend: HTMLElement) {
  let timer: number | null = null;
  let left = 0;
  const tick = () => {
    if (left <= 0) {
      stop();
      wait.hidden = true;
      resend.hidden = false;
      return;
    }
    wait.textContent = "Resend code in " + left + "s";
    wait.hidden = false;
    resend.hidden = true;
    left--;
  };
  const stop = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };
  return {
    start() {
      stop();
      left = 30;
      tick();
      timer = window.setInterval(tick, 1000);
    },
    stop,
  };
}
