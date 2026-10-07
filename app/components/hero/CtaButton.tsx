import type { ComponentPropsWithoutRef } from "react";
import styles from "./CtaButton.module.css";

type CtaButtonProps = ComponentPropsWithoutRef<"a"> & {
  size?: "large" | "small";
};

export function CtaButton({ size = "large", className, href = "#get-started", ...props }: CtaButtonProps) {
  return <a href={href} className={[styles.cta, styles[size], className].filter(Boolean).join(" ")} {...props} />;
}
