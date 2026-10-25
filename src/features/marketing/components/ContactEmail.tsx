import { site } from "@/config/site";

/** The contact address as a mailto link (from NEXT_PUBLIC_CONTACT_EMAIL). */
export function ContactEmail() {
  return <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;
}
