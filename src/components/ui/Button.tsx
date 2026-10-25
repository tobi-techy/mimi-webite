import type { ReactNode } from "react";
import { ShellLink, crossesShell } from "@/components/navigation/ShellLink";
import { Arrow } from "@/components/ui/Text";
import { cx } from "@/lib/cx";

type ButtonLinkProps = {
  href: string;
  /** Solid (primary), outlined (ghost), or the base style with no modifier (plain). */
  variant?: "primary" | "ghost" | "plain";
  arrow?: boolean;
  className?: string;
  id?: string;
  external?: boolean;
  children: ReactNode;
};

const isInternal = (href: string) => href.startsWith("/");

/** The design-system button as a link (`.x-btn`). Internal paths go through ShellLink. */
export function ButtonLink({
  href,
  variant = "primary",
  arrow,
  className,
  id,
  external,
  children,
}: ButtonLinkProps) {
  const cls = cx(
    "x-btn",
    variant === "primary" && "x-btn--o",
    variant === "ghost" && "x-btn--ghost",
    className,
  );
  const body = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  );
  if (isInternal(href))
    return (
      <ShellLink className={cls} href={href} id={id} crossShell={crossesShell(href, false)}>
        {body}
      </ShellLink>
    );
  return (
    <a
      className={cls}
      href={href}
      id={id}
      data-cuelume-tap=""
      {...(variant !== "primary" ? { "data-cuelume-emphasis": "subtle" } : {})}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
    >
      {body}
    </a>
  );
}

/** Underlined text link with an optional arrow (`.x-tlink`). */
export function TextLink({
  href,
  arrow,
  plain,
  external,
  children,
}: {
  href: string;
  arrow?: boolean;
  /** Without the `.x-txtlink` underline treatment. */
  plain?: boolean;
  external?: boolean;
  children: ReactNode;
}) {
  const cls = cx("x-tlink", !plain && "x-txtlink");
  const body = (
    <>
      {children}
      {arrow && <Arrow />}
    </>
  );
  if (isInternal(href))
    return (
      <ShellLink className={cls} href={href} crossShell={crossesShell(href, false)}>
        {body}
      </ShellLink>
    );
  return (
    <a className={cls} href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      {body}
    </a>
  );
}

/** A row of buttons (`.x-btns`). Fades up on scroll unless its block already does. */
export function ButtonRow({
  children,
  reveal,
  className,
}: {
  children: ReactNode;
  reveal?: boolean;
  className?: string;
}) {
  return <div className={cx("x-btns", className, reveal && "x-rv")}>{children}</div>;
}
