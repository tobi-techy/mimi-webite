"use client";

import { useEffect } from "react";
import { site } from "@/config/site";
import { sfx } from "@/lib/sound";

const FIELDS = ["Name", "Company", "Phone (WhatsApp)", "Main route or city"];

/** The pricing page pilot form opens the visitor's email app with their details filled in. */
export function PilotFormEnhancer() {
  useEffect(() => {
    const form = document.getElementById("pilotForm") as HTMLFormElement | null;
    if (!form) return;
    const onSubmit = (e: SubmitEvent) => {
      e.preventDefault();
      const lines = FIELDS.map(
        (k) => `${k}: ${(form.elements.namedItem(k) as HTMLInputElement | null)?.value ?? ""}`,
      );
      const r = form.querySelector<HTMLInputElement>('input[name="Shops on route"]:checked');
      lines.push("Shops on route: " + (r ? r.value : ""));
      const sent = document.getElementById("pilotSent");
      if (sent) sent.hidden = false;
      sfx("forms", "success", { emphasis: "strong" });
      location.href =
        `mailto:${site.contactEmail}?subject=${encodeURIComponent("Mimi pilot request")}` +
        `&body=${encodeURIComponent(lines.join("\n"))}`;
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);
  return null;
}
