import type { Metadata } from "next";

import { LegalLayout } from "../components/LegalLayout";
import { PRIVACY } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy · Mimi",
  description:
    "How Mimi and Rail Technology Concepts Ltd collect, use, share and protect personal data, and the rights you have under Nigerian data protection law.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      doc={PRIVACY}
      title="Privacy Policy"
      tocLabel="Privacy Policy contents"
      headerStickers={[{ name: "padlock", rotation: -8, size: "l", at: "left-0 right-0 top-0 bottom-0 m-auto" }]}
    />
  );
}
