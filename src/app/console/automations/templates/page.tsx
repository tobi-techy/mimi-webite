import type { Metadata } from "next";
import { USES_API } from "@/features/console/api/config";
import { TemplatesGallery } from "@/features/console/components/automations/TemplatesGallery";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Templates · Automations" };

export default function AutomationTemplatesPage() {
  if (USES_API) return <NotAvailable title="Templates" />;
  return (
    <ConsoleView label="Automation templates">
      <Page className="x-auto">
        <TemplatesGallery />
      </Page>
    </ConsoleView>
  );
}
