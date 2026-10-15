import type { ReactNode } from "react";

export function Lab({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.08em] text-muted ${className}`.trim()}>{children}</p>
  );
}

export function Big({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={`max-w-[18ch] text-[clamp(24px,2.5vw,36px)] font-medium leading-[1.05] tracking-[-0.035em] ${className}`.trim()}
    >
      {children}
    </h3>
  );
}

export function Tp({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`max-w-[46ch] text-base text-muted ${className}`.trim()}>{children}</p>;
}

export function Tile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <article
      className={`relative flex min-w-0 flex-col gap-3 rounded-sheet bg-tint2 p-[clamp(20px,2.4vw,30px)] ${className}`.trim()}
    >
      {children}
    </article>
  );
}
