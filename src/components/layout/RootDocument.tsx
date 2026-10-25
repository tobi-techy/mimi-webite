import type { ReactNode } from "react";
import { bootScript } from "@/lib/boot-script";
import { fontVariables } from "@/lib/fonts";
import "@/styles/theme.css";
import "@/styles/transitions.css";
import "@/styles/mimi.css";

/** The <html> document shared by the root layout and the global 404: fonts, theme boot, shared CSS. */
export function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- App Router document (layout.tsx and global-not-found.tsx), not pages/ */}
      <head>
        {/*
          Theme, motion start states and the first-load screen must be decided before first paint,
          so this tiny boot script is inlined. It is code we own, not markup.
        */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
