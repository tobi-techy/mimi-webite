import Link from "next/link";
import type { ComponentProps } from "react";
import { isConsolePath } from "@/config/routes";

type ShellLinkProps = Omit<ComponentProps<"a">, "href"> & { href: string; crossShell?: boolean };

/**
 * Internal link that knows about the two shells. Links within a shell use next/link (client
 * navigation + page transition). Links that cross between the marketing site and the console
 * load a full document, so each shell only ever carries its own stylesheet.
 */
export function ShellLink({ href, crossShell, ...rest }: ShellLinkProps) {
  // a plain anchor on purpose: crossing shells swaps the stylesheet, so it is a document load
  if (crossShell) return <a href={href} {...rest} />;
  return <Link href={href} {...rest} />;
}

/** True when a link from `fromConsole` to `href` leaves its shell. */
export const crossesShell = (href: string, fromConsole: boolean): boolean =>
  href.startsWith("/") && isConsolePath(href) !== fromConsole;
