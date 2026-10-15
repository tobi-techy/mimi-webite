"use client";

import { useState, type FormEvent } from "react";

import { pillClass } from "./Pill";
import { SITE } from "@/content/site";

const ROLES = ["I run a shop", "I'm a distributor", "I'm a brand"];

const FIELD =
  "min-h-12 w-full rounded-full border border-hairline bg-paper px-[18px] py-3.5 text-base text-ink";

type CtaFormProps = {
  /** Placeholder and label for the business field. */
  companyLabel: string;
  /** Which role is selected by default. */
  defaultRole: string;
  submitLabel: string;
};

/**
 * Pilot sign-up. Submits through `mailto:` today, matching the prototype; the
 * `handleSubmit` body is the single seam to swap for an API route or server
 * action later.
 */
export function CtaForm({ companyLabel, defaultRole, submitLabel }: CtaFormProps) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      `Name: ${data.get("name") ?? ""}`,
      `Shop or company: ${data.get("company") ?? ""}`,
      `WhatsApp: ${data.get("phone") ?? ""}`,
      String(data.get("role") ?? ""),
    ].join("\n");

    setSent(true);
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("Join the Mimi pilot")}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form
      className="mx-auto mt-[30px] grid max-w-[560px] grid-cols-1 gap-3 text-left min-[760px]:grid-cols-2"
      onSubmit={handleSubmit}
    >
      <input className={FIELD} name="name" type="text" placeholder="Name" aria-label="Name" required autoComplete="name" />
      <input
        className={FIELD}
        name="company"
        type="text"
        placeholder={companyLabel}
        aria-label={companyLabel}
        required
        autoComplete="organization"
      />
      <input
        className={FIELD}
        name="phone"
        type="tel"
        placeholder="WhatsApp number"
        aria-label="WhatsApp number"
        required
        autoComplete="tel"
      />
      <select className={FIELD} name="role" aria-label="Who are you" defaultValue={defaultRole} required>
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <button className={pillClass("ink", "col-span-full w-full justify-center")} type="submit">
        {submitLabel}
      </button>
      <p className="mt-1 text-base text-soft" role="status" aria-live="polite">
        {sent ? "Thanks. We'll message you on WhatsApp soon." : ""}
      </p>
    </form>
  );
}
