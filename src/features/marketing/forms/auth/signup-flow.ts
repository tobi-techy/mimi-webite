import {
  byId,
  EMAIL_RE,
  otpCode,
  resendTimer,
  setBusy,
  setError,
  showPanel,
  wireOtp,
  type Dir,
} from "@/features/marketing/forms/auth/flow-helpers";
import { prefersReducedMotion } from "@/lib/dom";

/**
 * Signup flow (/signup). Prototype: all state lives in memory and no network call is made.
 * Steps: 1 Google or work email, 2 six-digit code, 3 account type, 4 details (distributor or brand),
 * 5 trust and consent, then done (a stamp sticker slaps onto the art panel).
 */

type AccountType = "" | "distributor" | "brand";
type StepId = 1 | 2 | 3 | 4 | 5 | "done";
type State = {
  step: StepId;
  auth: "" | "google" | "email";
  email: string;
  type: AccountType;
  details: Record<string, string | string[]>;
  brands: string[];
  consents: Record<string, boolean>;
  whatsappUpdates: boolean;
  done: boolean;
};

type SignupData = Record<string, unknown>;

const PERSONAL = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "ymail.com",
];
const LINES: Record<AccountType, string> = {
  "": "One book for the route, the shop and the money.",
  distributor: "Get paid faster. Lose less on the route.",
  brand: "See what really sold, shop by shop.",
};

/** The one place the real API call goes. */
function submitSignup(data: SignupData): Promise<{ ok: true }> {
  // TODO: replace with the real request, e.g.
  // return fetch("https://api.userail.money/v1/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) throw new Error("Signup failed"); return r.json(); });
  void data;
  return new Promise((resolve) => window.setTimeout(() => resolve({ ok: true }), 1200));
}

const fresh = (): State => ({
  step: 1,
  auth: "",
  email: "",
  type: "",
  details: {},
  brands: [],
  consents: {},
  whatsappUpdates: false,
  done: false,
});

export function initSignupFlow(root: HTMLElement) {
  const reduce = prefersReducedMotion();
  const ac = new AbortController();
  const { signal } = ac;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  const S = fresh();

  const panels: Record<string, HTMLElement> = {
    "1": byId("su1"),
    "2": byId("su2"),
    "3": byId("su3"),
    "4d": byId("su4d"),
    "4b": byId("su4b"),
    "5": byId("su5"),
    done: byId("suDone"),
  };
  const bar = byId("suBar");
  const segs = Array.from(bar.children);
  const back = byId<HTMLButtonElement>("suBack");
  const key = (step: StepId) => (step === 4 ? (S.type === "brand" ? "4b" : "4d") : String(step));

  function show(step: StepId, dir: Dir | null, noFocus = false) {
    S.step = step;
    const p = panels[key(step)];
    const n = step === "done" ? 5 : step;
    byId("suStepTxt").textContent = step === "done" ? "Complete" : "Step " + step + " of 5";
    segs.forEach((s, i) => s.classList.toggle("is-on", i < n));
    bar.setAttribute("aria-valuenow", String(n));
    const canGoBack = typeof step === "number" && step >= 2;
    back.classList.toggle("is-off", !canGoBack);
    back.disabled = !canGoBack;
    if (step === 5) syncTrust();
    const focus =
      noFocus || !p
        ? undefined
        : step === 3 || step === "done"
          ? null
          : p.querySelector<HTMLElement>("input:not([type=radio]):not([type=checkbox]), select");
    showPanel(root, panels, key(step), dir, focus, reduce);
  }

  back.addEventListener(
    "click",
    () => {
      const s = S.step;
      if (s === 2) show(1, "back");
      else if (s === 3) show(S.auth === "google" ? 1 : 2, "back");
      else if (s === 4) show(3, "back");
      else if (s === 5) show(4, "back");
    },
    { signal },
  );

  // Enter submits the step from radios, checkboxes and selects too
  root.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter") return;
      const t = e.target as HTMLInputElement;
      const f = t.form;
      if (!f || t.id === "d-br") return;
      if (t.type === "radio" || t.type === "checkbox" || t.tagName === "SELECT") {
        e.preventDefault();
        f.requestSubmit();
      }
    },
    { signal },
  );

  // 1: Google or work email
  const gBtn = byId<HTMLButtonElement>("suGoogle");
  gBtn.addEventListener(
    "click",
    () => {
      if (gBtn.disabled) return;
      setBusy(gBtn, true, "Connecting to Google…");
      later(() => {
        setBusy(gBtn, false, "Continue with Google");
        S.auth = "google";
        S.email = "";
        show(3, "fwd");
      }, 1000);
    },
    { signal },
  );
  const email = byId<HTMLInputElement>("suEmail");
  email.addEventListener("input", () => setError(email, ""), { signal });

  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>(".x-su__otp input"));
  const otpSet = byId("suOtpSet");
  const timer = resendTimer(byId("suWait"), byId("suResend"));

  byId("suF1").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      const v = email.value.trim().toLowerCase();
      let m = "";
      if (!v) m = "Enter your work email.";
      else if (!EMAIL_RE.test(v)) m = "Enter a valid email, like you@company.com.";
      else if (PERSONAL.includes(v.split("@")[1] ?? ""))
        m = "Use your company email so we can set up your team's workspace.";
      if (!setError(email, m)) {
        email.focus();
        return;
      }
      S.auth = "email";
      S.email = v;
      byId("suSentTo").textContent = v;
      boxes.forEach((b) => (b.value = ""));
      setError(otpSet, "");
      byId("suResendMsg").textContent = "";
      timer.start();
      show(2, "fwd");
    },
    { signal },
  );

  // 2: six-digit code (any 6 digits pass in the prototype)
  wireOtp(boxes, () => setError(otpSet, ""), signal);
  byId("suF2").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      if (!setError(otpSet, /^\d{6}$/.test(otpCode(boxes)) ? "" : "Enter all 6 digits.")) {
        (boxes.find((b) => !b.value) ?? boxes[0])?.focus();
        return;
      }
      show(3, "fwd");
    },
    { signal },
  );
  byId("suResend").addEventListener(
    "click",
    () => {
      timer.start();
      byId("suResendMsg").textContent = "New code sent to " + S.email + ".";
      boxes[0]?.focus();
    },
    { signal },
  );
  byId("suChange").addEventListener("click", () => show(1, "back"), { signal });

  // 3: account type, which also sets the art panel's line
  const line = byId("suLine");
  let lineT = 0;
  function setLine(t: AccountType) {
    const txt = LINES[t];
    if (line.textContent === txt) return;
    if (reduce) {
      line.textContent = txt;
      return;
    }
    window.clearTimeout(lineT);
    line.classList.add("is-swap");
    lineT = window.setTimeout(() => {
      line.textContent = txt;
      line.classList.remove("is-swap");
    }, 180);
  }
  const typeRadios = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="suType"]'));
  const cont3 = byId<HTMLButtonElement>("suCont3");
  function setType(t: AccountType) {
    S.type = t;
    typeRadios.forEach((r) => {
      r.checked = r.value === t;
      r.closest(".x-su__opt")?.classList.toggle("is-on", r.value === t);
    });
    cont3.disabled = !t;
    setLine(t);
  }
  typeRadios.forEach((r) =>
    r.addEventListener(
      "change",
      () => {
        if (r.checked) setType(r.value as AccountType);
      },
      { signal },
    ),
  );
  byId("suF3").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      if (S.type) show(4, "fwd");
    },
    { signal },
  );

  // 4 (distributor): brand tags
  const tagBox = byId("suTags");
  const tagIn = byId<HTMLInputElement>("d-br");
  function drawTags() {
    tagBox.querySelectorAll(".x-su__chip").forEach((c) => c.remove());
    S.brands.forEach((name, i) => {
      const c = document.createElement("span");
      const x = document.createElement("button");
      const t = document.createElement("span");
      c.className = "x-su__chip";
      t.textContent = name;
      x.type = "button";
      x.textContent = "×";
      x.setAttribute("aria-label", "Remove " + name);
      x.addEventListener("click", () => {
        S.brands.splice(i, 1);
        drawTags();
        tagIn.focus();
      });
      c.appendChild(t);
      c.appendChild(x);
      tagBox.insertBefore(c, tagIn);
    });
  }
  function addTags(v: string) {
    v.split(",").forEach((part) => {
      const p = part.trim();
      if (p && !S.brands.some((b) => b.toLowerCase() === p.toLowerCase())) S.brands.push(p);
    });
    tagIn.value = "";
    drawTags();
  }
  tagIn.addEventListener(
    "keydown",
    (e) => {
      if ((e.key === "Enter" || e.key === ",") && tagIn.value.trim()) {
        e.preventDefault();
        addTags(tagIn.value);
      } else if (e.key === ",") e.preventDefault();
      else if (e.key === "Backspace" && !tagIn.value && S.brands.length) {
        S.brands.pop();
        drawTags();
      }
    },
    { signal },
  );
  tagIn.addEventListener("input", () => tagIn.value.includes(",") && addTags(tagIn.value), { signal });
  tagIn.addEventListener("blur", () => tagIn.value.trim() && addTags(tagIn.value), { signal });
  tagBox.addEventListener("click", (e) => e.target === tagBox && tagIn.focus(), { signal });

  // 4: details
  function validate(form: HTMLFormElement): boolean {
    let first: HTMLElement | null = null;
    form
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-req], select[data-req]")
      .forEach((el) => {
        if (!setError(el, el.value.trim() ? "" : (el.getAttribute("data-req") ?? "")) && !first) first = el;
      });
    const ph = form.querySelector<HTMLInputElement>("[data-phone]");
    if (ph) {
      let d = ph.value.replace(/\D/g, "");
      if (d.length === 11 && d[0] === "0") d = d.slice(1);
      if (
        !setError(ph, d.length === 10 ? "" : "Enter the 10 digits after +234, like 803 123 4567.") &&
        !first
      )
        first = ph;
      ph.setAttribute("data-digits", d);
    }
    form.querySelectorAll<HTMLFieldSetElement>("fieldset[data-group]").forEach((fs) => {
      if (
        !setError(fs, fs.querySelector("input:checked") ? "" : (fs.getAttribute("data-group") ?? "")) &&
        !first
      )
        first = fs.querySelector("input");
    });
    (first as HTMLElement | null)?.focus();
    return !first;
  }
  root.addEventListener(
    "input",
    (e) => {
      const t = e.target as HTMLElement;
      if (t.closest("#su4d, #su4b") && t.getAttribute("aria-invalid") === "true") setError(t, "");
    },
    { signal },
  );
  root.addEventListener(
    "change",
    (e) => {
      const t = e.target as HTMLElement;
      const fs = t.closest<HTMLElement>("#su4d fieldset[data-group], #su4b fieldset[data-group], #suTrust");
      if (fs) setError(fs, "");
      if (t.tagName === "SELECT") setError(t, "");
    },
    { signal },
  );
  function collect(form: HTMLFormElement): Record<string, string | string[]> {
    const o: Record<string, string | string[]> = {};
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name], select[name]").forEach((el) => {
      if (el instanceof HTMLInputElement && el.type === "radio") {
        if (el.checked) o[el.name] = el.value;
      } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
        const list = (o[el.name] as string[] | undefined) ?? [];
        if (el.checked) list.push(el.value);
        o[el.name] = list;
      } else
        o[el.name] = el.hasAttribute("data-phone")
          ? "+234" + (el.getAttribute("data-digits") ?? "")
          : el.value.trim();
    });
    return o;
  }
  (["suF4d", "suF4b"] as const).forEach((id) => {
    byId(id).addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        if (id === "suF4d" && tagIn.value.trim()) addTags(tagIn.value);
        if (!validate(form)) return;
        S.details = collect(form);
        if (id === "suF4d") S.details.brands = S.brands.slice();
        show(5, "fwd");
      },
      { signal },
    );
  });

  // 5: trust and consent
  const create = byId<HTMLButtonElement>("suCreate");
  function syncTrust() {
    const brand = S.type === "brand";
    byId("suMoneyTxt").textContent = brand
      ? "Mimi never moves or holds money."
      : "Mimi never moves or holds money. Payments settle to our own account.";
    const lbl = create.querySelector("[data-lbl]");
    if (lbl) lbl.textContent = brand ? "Create brand workspace" : "Create workspace";
  }
  byId("suF5").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      if (create.disabled) return;
      const f = e.target as HTMLFormElement;
      const trust = byId("suTrust");
      const need = ["money", "data", "drafts"];
      const box = (n: string) => f.elements.namedItem(n) as HTMLInputElement;
      const ok = need.every((n) => box(n).checked);
      if (!setError(trust, ok ? "" : "Tick all three to continue.")) {
        need
          .map(box)
          .find((c) => !c.checked)
          ?.focus();
        return;
      }
      need.forEach((n) => (S.consents[n] = true));
      S.whatsappUpdates = box("updates").checked;
      const label = create.querySelector("[data-lbl]")?.textContent ?? "";
      setBusy(create, true, "Creating workspace…");
      const data: SignupData = {
        auth: S.auth,
        email: S.email || null,
        type: S.type,
        consents: S.consents,
        whatsappUpdates: S.whatsappUpdates,
        ...S.details,
      };
      void submitSignup(data).then(() => {
        if (signal.aborted) return;
        setBusy(create, false, label);
        S.done = true;
        const name = typeof S.details.name === "string" ? S.details.name : "";
        const first = name.split(/\s+/)[0];
        byId("suDoneH").textContent = first ? "You're in, " + first + "." : "You're in.";
        byId("suDoneSub").textContent =
          S.type === "brand"
            ? "Next, invite the distributors you work with, or sponsor a pilot on one of their routes."
            : "Your free pilot covers one route and up to 20 shops for 4 weeks. Next, invite your reps and shops to Mimi on WhatsApp.";
        show("done", "fwd");
        slap();
      });
    },
    { signal },
  );

  // done: a sticker slaps onto the art panel
  function slap() {
    const art = byId("suArt");
    art.querySelector(".x-su__slap")?.remove();
    const el = document.createElement("span");
    const im = byId<HTMLImageElement>("suStamp").cloneNode(false) as HTMLImageElement;
    const small = window.innerWidth < 1024;
    im.removeAttribute("id");
    im.style.display = "";
    el.className = "x-slap x-su__slap";
    el.style.left = small ? "50%" : "60%";
    el.style.top = small ? "50%" : "40%";
    el.style.setProperty("--sw", (small ? 110 : 200) + "px");
    el.style.setProperty("--r", "-12deg");
    el.appendChild(im);
    art.appendChild(el);
  }

  return {
    /** Called on entry and whenever ?type= changes (type=distributor|brand preselects step 3). */
    enter(query: string, first: boolean) {
      const m = /(?:^|&)type=(distributor|brand)(?:&|$)/.exec(query);
      if (m) setType(m[1] as AccountType);
      if (first || m) show(S.step, null, true);
    },
    destroy() {
      ac.abort();
      timer.stop();
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(lineT);
      document.getElementById("suArt")?.querySelector(".x-su__slap")?.remove();
    },
  };
}
