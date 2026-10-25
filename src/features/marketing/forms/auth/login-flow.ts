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
 * Login flow (/login). Prototype: all state lives in memory and no network call is made.
 * Steps: 1 Google (simulated) or work email, 2 six-digit code (any 6 digits pass), then done.
 */

type StepId = 1 | 2 | "done";
type LoginData = { method: "google" } | { method: "email"; email: string; code: string };

/** The one place the real API call goes. */
function submitLogin(data: LoginData): Promise<{ ok: true }> {
  // TODO: replace with the real request, e.g.
  // return fetch("https://api.userail.money/v1/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => { if (!r.ok) throw new Error("Login failed"); return r.json(); });
  void data;
  return new Promise((resolve) => window.setTimeout(() => resolve({ ok: true }), 600));
}

export function initLoginFlow(root: HTMLElement) {
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
  const L: { step: StepId; method: "" | "google" | "email"; email: string } = {
    step: 1,
    method: "",
    email: "",
  };

  const panels: Record<string, HTMLElement> = { "1": byId("li1"), "2": byId("li2"), done: byId("liDone") };

  function show(step: StepId, dir: Dir | null, noFocus = false) {
    L.step = step;
    const p = panels[String(step)];
    const focus =
      noFocus || !p ? undefined : p.querySelector<HTMLElement>(step === "done" ? ".x-btn" : "input");
    showPanel(root, panels, String(step), dir, focus, reduce);
  }

  function signedIn() {
    byId("liDoneSub").textContent =
      L.method === "google"
        ? "Signed in with Google. Your book is ready."
        : "Signed in as " + L.email + ". Your book is ready.";
    show("done", "fwd");
  }

  // 1: Google (simulated 1s) or work email
  const gBtn = byId<HTMLButtonElement>("liGoogle");
  gBtn.addEventListener(
    "click",
    () => {
      if (gBtn.disabled) return;
      setBusy(gBtn, true, "Connecting to Google…");
      later(() => {
        L.method = "google";
        L.email = "";
        void submitLogin({ method: "google" }).then(() => {
          if (signal.aborted) return;
          setBusy(gBtn, false, "Continue with Google");
          signedIn();
        });
      }, 1000);
    },
    { signal },
  );

  const email = byId<HTMLInputElement>("liEmail");
  email.addEventListener("input", () => setError(email, ""), { signal });
  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>(".x-su__otp input"));
  const otpSet = byId("liOtpSet");
  const timer = resendTimer(byId("liWait"), byId("liResend"));

  byId("liF1").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      const v = email.value.trim().toLowerCase();
      let m = "";
      if (!v) m = "Enter your work email.";
      else if (!EMAIL_RE.test(v)) m = "Enter a valid email, like you@company.com.";
      if (!setError(email, m)) {
        email.focus();
        return;
      }
      L.method = "email";
      L.email = v;
      byId("liSentTo").textContent = v;
      boxes.forEach((b) => (b.value = ""));
      setError(otpSet, "");
      byId("liResendMsg").textContent = "";
      timer.start();
      show(2, "fwd");
    },
    { signal },
  );

  // 2: six-digit code
  wireOtp(boxes, () => setError(otpSet, ""), signal);
  const verify = byId<HTMLButtonElement>("liVerify");
  byId("liF2").addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      if (verify.disabled) return;
      const code = otpCode(boxes);
      if (!setError(otpSet, /^\d{6}$/.test(code) ? "" : "Enter all 6 digits.")) {
        (boxes.find((b) => !b.value) ?? boxes[0])?.focus();
        return;
      }
      setBusy(verify, true, "Logging in…");
      void submitLogin({ method: "email", email: L.email, code }).then(() => {
        if (signal.aborted) return;
        setBusy(verify, false, "Log in");
        timer.stop();
        signedIn();
      });
    },
    { signal },
  );
  byId("liResend").addEventListener(
    "click",
    () => {
      timer.start();
      byId("liResendMsg").textContent = "New code sent to " + L.email + ".";
      boxes[0]?.focus();
    },
    { signal },
  );
  byId("liChange").addEventListener(
    "click",
    () => {
      timer.stop();
      show(1, "back");
    },
    { signal },
  );

  show(1, null, true);

  return {
    destroy() {
      ac.abort();
      timer.stop();
      timers.forEach((id) => window.clearTimeout(id));
    },
  };
}
