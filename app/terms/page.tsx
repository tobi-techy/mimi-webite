import type { Metadata } from "next";

import { LegalLayout } from "../components/LegalLayout";
import { TERMS } from "@/content/terms";

export const metadata: Metadata = {
  title: "Terms of Service · Mimi",
  description:
    "The terms that govern your use of Mimi, the WhatsApp helper for shops and distributors built by Rail Technology Concepts Ltd.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalLayout
      doc={TERMS}
      title="Terms of Service"
      tocLabel="Terms of Service contents"
      headerStickers={[{ name: "waybill", rotation: 7, size: "m", at: "left-0 right-0 top-0 bottom-0 m-auto" }]}
    />
  );
}
