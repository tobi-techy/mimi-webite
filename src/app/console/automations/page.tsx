import type { Metadata } from "next";
import { USES_API } from "@/features/console/api/config";
import { AutomationsList } from "@/features/console/components/automations/AutomationsList";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Automations" };

export default function AutomationsPage() {
  if (USES_API) return <NotAvailable title="Automations" />;
  return (
    <ConsoleView label="Automations">
      <Page className="x-auto">
        <AutomationsList />
      </Page>
    </ConsoleView>
  );
}
