import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { ContactFormSection } from "@/features/marketing/sections/contact/ContactFormSection";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Book a pilot",
  description: "Book a free Mimi pilot. Tell us about your routes. We'll reply within two working days.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <RouteView route="contact">
      <JsonLd data={breadcrumbJsonLd([{ name: "Book a pilot", path: "/contact" }])} />
      <ContactFormSection />
    </RouteView>
  );
}
