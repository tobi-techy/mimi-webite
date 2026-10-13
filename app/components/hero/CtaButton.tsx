import type { ComponentPropsWithoutRef } from "react";
import styles from "./CtaButton.module.css";

type CtaButtonProps = ComponentPropsWithoutRef<"button"> & {
  size?: "large" | "small";
};

/* Rendered as a button, not a link: there is no destination yet, so it must not
 * promise navigation. Wire an href-based variant back when a route exists. */
export function CtaButton({ size = "large", className, type = "button", ...props }: CtaButtonProps) {
  return <button type={type} className={[styles.cta, styles[size], className].filter(Boolean).join(" ")} {...props} />;
}
