import Link from "next/link";
import type { ReactNode } from "react";

export type PillVariant = "ink" | "ghost" | "cream";

const VARIANTS: Record<PillVariant, string> = {
  ink: "bg-ink text-surface hover:-translate-y-px hover:shadow-[0_10px_20px_rgba(17,17,17,0.22)]",
  cream: "bg-cream text-solid hover:-translate-y-px hover:shadow-[0_8px_18px_rgba(17,17,17,0.2)]",
  ghost: "border border-hairline text-ink hover:bg-tint",
};

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-medium leading-none " +
  "transition-[transform,box-shadow,background-color] duration-200 ease-soft";

export function pillClass(variant: PillVariant, className = "") {
  const size = variant === "cream" ? "px-5 py-3.5 text-[15px]" : "px-6 py-[15px] text-base";
  return `${BASE} ${size} ${VARIANTS[variant]} ${className}`.trim();
}

type PillLinkProps = {
  href: string;
  variant?: PillVariant;
  className?: string;
  children: ReactNode;
  /** Pass through for external/mail links so next/link is not used. */
  external?: boolean;
};

export function PillLink({ href, variant = "ink", className, children, external }: PillLinkProps) {
  const classes = pillClass(variant, className);
  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  );
}
