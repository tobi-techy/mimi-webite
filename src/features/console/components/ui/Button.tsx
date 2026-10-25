import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "@/lib/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

/** Class list for a console button (`.x-btn`): neutral 3px buttons in three variants. */
export function buttonClass(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cx(
    "x-btn",
    variant === "primary" && "x-btn--primary",
    variant === "ghost" && "x-btn--ghost",
    size === "sm" && "x-btn--sm",
    className,
  );
}

type Variants = { variant?: ButtonVariant; size?: ButtonSize };

/** A console `<button>` (type="button" unless set). */
export function Button({
  variant,
  size,
  className,
  type = "button",
  ...rest
}: ComponentProps<"button"> & Variants) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

/** A link that looks like a console button. */
export function ButtonLink({ variant, size, className, ...rest }: ComponentProps<typeof Link> & Variants) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
