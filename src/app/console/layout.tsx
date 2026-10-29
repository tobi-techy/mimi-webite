import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ConsoleShell } from "@/features/console/components/shell/ConsoleShell";
import { siteViewport } from "@/lib/seo";

/* Edge to edge on phones; the on-screen keyboard resizes the layout so it never covers the composer */
export const viewport: Viewport = { ...siteViewport, viewportFit: "cover", interactiveWidget: "resizes-content" };

/** The console is a product demo with sample data: never indexed. */
export const metadata: Metadata = {
  title: { default: "Console demo", template: "%s · Mimi console demo" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
