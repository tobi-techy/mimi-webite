import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { SecurityApprovals } from "@/features/marketing/sections/security/SecurityApprovals";
import { SecurityCta } from "@/features/marketing/sections/security/SecurityCta";
import { SecurityData } from "@/features/marketing/sections/security/SecurityData";
import { SecurityIntro } from "@/features/marketing/sections/security/SecurityIntro";
import { SecurityRules } from "@/features/marketing/sections/security/SecurityRules";
import { JsonLd } from "@/components/ui/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Security and data",
  description:
    "Shops own their data. Mimi never touches the money. The rules Mimi keeps, how approvals work and how shop data is handled.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <RouteView route="security">
      <JsonLd data={breadcrumbJsonLd([{ name: "Security and data", path: "/security" }])} />
      <SecurityIntro />
      <SecurityRules />
      <SecurityApprovals />
      <SecurityData />
      <SecurityCta />
    </RouteView>
  );
}
