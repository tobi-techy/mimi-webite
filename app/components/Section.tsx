import type { ReactNode } from "react";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 text-xs tracking-[0.02em] text-muted ${className}`.trim()}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
      {children}
    </p>
  );
}

export function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`section ${className}`.trim()}>
      {children}
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  titleId,
  className = "",
}: {
  eyebrow: string;
  title: string;
  titleId?: string;
  className?: string;
}) {
  return (
    <div className={`max-w-[760px] ${className}`.trim()}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={titleId}
        className="mt-3 text-[clamp(28px,3.4vw,52px)] font-medium leading-[1.02] tracking-[-0.035em]"
      >
        {title}
      </h2>
    </div>
  );
}
