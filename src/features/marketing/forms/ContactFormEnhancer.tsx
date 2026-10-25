"use client";

import { useEffect } from "react";
import { site } from "@/config/site";
import { prefersReducedMotion } from "@/lib/dom";
import { sfx } from "@/lib/sound";

const FIELDS: Array<[name: string, label: string]> = [
  ["name", "Full name"],
  ["company", "Company"],
  ["role", "Role"],
  ["email", "Work email"],
  ["phone", "Phone/WhatsApp"],
  ["shops", "Number of shops you serve"],
  ["city", "City/area"],
  ["message", "Message"],
];

/**
 * The /contact pilot request form. With NEXT_PUBLIC_FORM_ENDPOINT set it POSTs JSON there;
 * otherwise (or if the request fails) it opens the visitor's email app, addressed to the contact email.
 */
export function ContactFormEnhancer() {
  useEffect(() => {
    const form = document.getElementById("contactForm") as HTMLFormElement | null;
    const ok = document.getElementById("contactOk");
    const err = document.getElementById("contactErr");
    if (!form || !ok || !err) return;
    let alive = true;

    const done = (msg?: string) => {
      const heading = ok.querySelector(".x-d3");
      if (msg && heading) heading.textContent = msg;
      form.hidden = true;
      ok.hidden = false;
      sfx("forms", "success", { emphasis: "strong" });
      /* the form collapses, so bring the confirmation into the middle of the screen, clear of the nav */
      ok.focus({ preventScroll: true });
      ok.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    const viaMail = (data: Record<string, string>) => {
      const body = FIELDS.map(([k, label]) => `${label}: ${data[k] ?? ""}`).join("\n");
      location.href =
        `mailto:${site.contactEmail}?subject=${encodeURIComponent("Pilot request: " + data.company)}` +
        `&body=${encodeURIComponent(body)}`;
      done("Thanks. Your email app should open with your details. Send it and we'll be in touch.");
    };

    const errDefault = err.textContent ?? "";
    const labelOf = (name: string) => FIELDS.find(([k]) => k === name)?.[1] ?? name;
    const controls = () =>
      Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select, textarea"));
    /* Say which fields need attention, and mark them so screen readers and the CSS can tell. */
    const showErrors = () => {
      const bad = controls().filter((c) => !c.validity.valid);
      controls().forEach((c) => c.toggleAttribute("aria-invalid", !c.validity.valid));
      const missing = bad.filter((c) => c.validity.valueMissing).map((c) => labelOf(c.name));
      const email = bad.find((c) => c.name === "email" && c.validity.typeMismatch);
      const parts: string[] = [];
      if (missing.length) parts.push(`Please fill in: ${missing.join(", ")}.`);
      if (email) parts.push("Check the work email address.");
      err.textContent = parts.join(" ") || errDefault;
      err.hidden = false;
      return bad;
    };
    /* Once a field is fixed, clear its mark; once every field is fine, clear the message. */
    const onEdit = (e: Event) => {
      const c = e.target as HTMLInputElement;
      if (!c.hasAttribute?.("aria-invalid")) return;
      if (c.validity.valid) c.removeAttribute("aria-invalid");
      if (form.checkValidity()) err.hidden = true;
      else if (!err.hidden) showErrors();
    };

    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        const bad = showErrors();
        sfx("forms", "error", { emphasis: "subtle" });
        bad[0]?.focus();
        return;
      }
      err.hidden = true;
      const data: Record<string, string> = {};
      FIELDS.forEach(([k]) => {
        const el = form.elements.namedItem(k) as HTMLInputElement | null;
        data[k] = String(el?.value ?? "").trim();
      });
      if (!site.formEndpoint) return viaMail(data);
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const btnText = btn?.firstChild?.nodeType === Node.TEXT_NODE ? btn.firstChild : null;
      const idleText = btnText?.textContent ?? "";
      if (btn) {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
        if (btnText) btnText.textContent = "Sending";
      }
      fetch(site.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...data,
          /* FormSubmit options: subject line, readable table email, reply goes to the visitor. */
          _subject: `Mimi pilot request: ${data.company || data.name}`,
          _template: "table",
          _replyto: data.email,
          _captcha: "false",
        }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          /* FormSubmit answers 200 with success "false" when the inbox is not activated yet. */
          const res = (await r.json().catch(() => ({}))) as { success?: string | boolean };
          if (res.success === false || res.success === "false") throw new Error("Not sent");
          if (alive) done("Thanks. We have your details and will reply within two working days.");
        })
        .catch(() => {
          if (alive) viaMail(data);
        })
        .finally(() => {
          if (!btn) return;
          btn.disabled = false;
          btn.removeAttribute("aria-busy");
          if (btnText) btnText.textContent = idleText;
        });
    };

    form.addEventListener("submit", onSubmit);
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    return () => {
      alive = false;
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("input", onEdit);
      form.removeEventListener("change", onEdit);
    };
  }, []);
  return null;
}
