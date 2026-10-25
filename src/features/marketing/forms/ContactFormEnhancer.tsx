"use client";

import { useEffect } from "react";
import { site } from "@/config/site";
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
      ok.focus();
    };
    const viaMail = (data: Record<string, string>) => {
      const body = FIELDS.map(([k, label]) => `${label}: ${data[k] ?? ""}`).join("\n");
      location.href =
        `mailto:${site.contactEmail}?subject=${encodeURIComponent("Pilot request: " + data.company)}` +
        `&body=${encodeURIComponent(body)}`;
      done("Thanks. Your email app should open with your details. Send it and we'll be in touch.");
    };

    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        err.hidden = false;
        sfx("forms", "error", { emphasis: "subtle" });
        form.querySelector<HTMLElement>(":invalid")?.focus();
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
      if (btn) btn.disabled = true;
      fetch(site.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      })
        .then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          if (alive) done("Thanks. We have your details and will reply within two working days.");
        })
        .catch(() => {
          if (alive) viaMail(data);
        })
        .finally(() => {
          if (btn) btn.disabled = false;
        });
    };

    form.addEventListener("submit", onSubmit);
    return () => {
      alive = false;
      form.removeEventListener("submit", onSubmit);
    };
  }, []);
  return null;
}
