import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { ContactFormSection } from "@/features/marketing/sections/contact/ContactFormSection";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Book a free pilot for your distribution business",
  description:
    "Book a free Mimi pilot for your FMCG distribution routes in Nigeria. Tell us about your shops and reps. We reply within two working days.",
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
