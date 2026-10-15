"use client";

import { useState, type FormEvent } from "react";

/** Footer capture. Local confirmation only, like the prototype. */
export function NewsletterForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <>
      <form
        className="mt-[18px] flex max-w-[340px] items-center gap-2 rounded-full border border-hairline bg-paper p-[5px] pl-[18px]"
        onSubmit={handleSubmit}
      >
        <input
          className="min-h-10 min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
          type="email"
          name="email"
          placeholder="Get updates"
          aria-label="Email for updates"
          required
        />
        <button
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-base text-surface"
          type="submit"
          aria-label="Subscribe"
        >
          →
        </button>
      </form>
      <p className="mt-4 text-base text-soft" role="status" aria-live="polite">
        {sent ? "Thanks. We'll message you on WhatsApp soon." : ""}
      </p>
    </>
  );
}
