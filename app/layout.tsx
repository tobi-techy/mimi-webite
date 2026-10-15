import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Sans } from "next/font/google";

import "./globals.css";
import { AppMotion } from "./components/AppMotion";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { SITE } from "@/content/site";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/* Runs before first paint so the stored theme (or the system one) is on <html>
 * with no flash of the wrong colours. */
const THEME_SCRIPT = `try{var s=localStorage.getItem("mimi-theme");if(s!=="light"&&s!=="dark"){s=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",s)}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Mimi: your shop helper on WhatsApp",
    template: "%s",
  },
  description: SITE.description,
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: "/brand/icons/mimi-favicon-tile.svg", type: "image/svg+xml" },
      { url: "/brand/favicon/mimi-favicon-tile-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon/mimi-favicon-black-32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Mimi: your shop helper on WhatsApp",
    description: SITE.description,
    url: "/",
    images: [{ url: "/images/hero.jpg", width: 1800, height: 957, alt: "Mimi, your shop helper on WhatsApp" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimi: your shop helper on WhatsApp",
    description: SITE.description,
    images: ["/images/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F0" },
    { media: "(prefers-color-scheme: dark)", color: "#14130F" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <AppMotion />
        <div className="grain" aria-hidden="true" />
        <div className="sheet">
          <div className="inner">
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
