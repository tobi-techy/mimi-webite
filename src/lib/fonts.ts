import localFont from "next/font/local";

/**
 * Geist, self-hosted and trimmed to what the site uses: the sans variable font instanced to the
 * 400–500 weight range and the mono at 400, both subset to Latin plus the arrows and symbols in
 * the copy (built from the `geist` package files).
 *
 * Geist has no ₦ (U+20A6). The fallback stack is the platform's UI face (SF Pro on a Mac, Segoe UI
 * on Windows, Roboto on Android), which has a ₦ drawn at a matching weight and baseline. Next's
 * metric-adjusted Arial fallback is turned off: it would sit first in the stack and catch the ₦
 * in Arial instead (Tobi, 4 Nov 2026: keep Geist, make ₦ render cleanly).
 */
const geistSans = localFont({
  src: "../assets/fonts/geist-sans-400-500.woff2",
  variable: "--font-geist-sans",
  weight: "400 500",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
});

const geistMono = localFont({
  src: "../assets/fonts/geist-mono-400.woff2",
  variable: "--font-geist-mono",
  weight: "400",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Roboto Mono", "monospace"],
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
