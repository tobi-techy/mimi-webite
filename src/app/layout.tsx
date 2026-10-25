import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { siteIcons, siteViewport } from "@/lib/seo";
import { RootDocument } from "@/components/layout/RootDocument";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.founder }],
  creator: site.company,
  publisher: site.legalName,
  icons: siteIcons,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.shareTitle,
    description: site.description,
    url: "/",
    locale: "en_NG",
    images: [site.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: site.shareTitle,
    description: site.description,
    images: [site.ogImage.url],
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = siteViewport;

/**
 * Root layout shared by both shells. Each shell ((marketing) and console) adds its own layout and
 * stylesheet below this; the global 404 (global-not-found.tsx) renders the same document itself.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <RootDocument>{children}</RootDocument>;
}
