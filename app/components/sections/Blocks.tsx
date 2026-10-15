import type { ReactNode } from "react";

import { CtaForm } from "../CtaForm";
import { FAQ } from "../FAQ";
import { Eyebrow, Section, SectionHead } from "../Section";
import type { FaqItem } from "@/content/faq-types";

const FACTS = ["Works in WhatsApp, no new app", "English and Pidgin", "Reads the book you already keep"];

/** Home problem statement plus the "built in Ado-Ekiti" facts. */
export function Statement() {
  return (
    <Section>
      <p
        data-reveal
        className="text-[clamp(26px,3.3vw,46px)] font-medium leading-[1.14] tracking-[-0.035em]"
      >
        Shops run on memory. <span className="text-faint">The best sellers run out first,</span> fake alerts slip
        through, <span className="text-faint">and the distributor can&apos;t see who is doing well.</span> Mimi keeps
        the book so you don&apos;t have to.
      </p>
      <div
        data-reveal
        className="mt-[clamp(40px,6vw,72px)] flex flex-wrap items-baseline justify-between gap-x-7 gap-y-3.5 border-t border-hairline pt-[22px]"
      >
        <p className="text-[15px] text-muted">Built in Ado-Ekiti for the shops that feed Nigeria</p>
        <div className="flex flex-wrap gap-2.5">
          {FACTS.map((fact) => (
            <span key={fact} className="rounded-full bg-tint2 px-4 py-[9px] text-sm text-soft">
              {fact}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

/** A single statement between two hairlines (the pricing notes). */
export function PriceBand({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[clamp(56px,8vw,110px)] border-y border-hairline py-[clamp(28px,4vw,48px)]">
      <p className="max-w-[26ch] text-[clamp(26px,3.3vw,46px)] font-medium leading-[1.14] tracking-[-0.035em]">
        {children}
      </p>
    </div>
  );
}

/** The pilot sign-up block at the foot of every marketing page. */
export function GetStarted({
  title,
  sub,
  companyLabel,
  defaultRole,
  submitLabel,
}: {
  title: string;
  sub: string;
  companyLabel: string;
  defaultRole: string;
  submitLabel: string;
}) {
  return (
    <div
      data-reveal
      className="relative mt-[clamp(30px,4vw,50px)] rounded-panel bg-tint2 px-[clamp(20px,4vw,70px)] py-[clamp(34px,5vw,72px)] text-center"
    >
      <Eyebrow>Get started</Eyebrow>
      <h2 className="mt-3 text-[clamp(28px,3.4vw,52px)] font-medium leading-[1.02] tracking-[-0.035em]">{title}</h2>
      <p className="mx-auto mt-4 max-w-[54ch] text-base text-muted">{sub}</p>
      <CtaForm companyLabel={companyLabel} defaultRole={defaultRole} submitLabel={submitLabel} />
    </div>
  );
}

/** FAQ section wrapper. */
export function FaqSection({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: FaqItem[] }) {
  return (
    <Section id={id}>
      <div data-reveal>
        <SectionHead eyebrow={eyebrow} title={title} />
        <FAQ items={items} />
      </div>
    </Section>
  );
}
