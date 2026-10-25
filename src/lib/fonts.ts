import localFont from "next/font/local";

/**
 * Geist, self-hosted and trimmed to what the site uses: the sans variable font instanced to the
 * 400–500 weight range and the mono at 400, both subset to Latin plus the arrows and symbols in
 * the copy (built from the `geist` package files). Missing glyphs such as ₦ fall back to the system font.
 */
const geistSans = localFont({
  src: "../assets/fonts/geist-sans-400-500.woff2",
  variable: "--font-geist-sans",
  weight: "400 500",
  display: "swap",
});

const geistMono = localFont({
  src: "../assets/fonts/geist-mono-400.woff2",
  variable: "--font-geist-mono",
  weight: "400",
  display: "swap",
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
