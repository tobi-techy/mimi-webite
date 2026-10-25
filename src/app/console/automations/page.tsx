import type { Metadata } from "next";
import { AutomationsList } from "@/features/console/components/automations/AutomationsList";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Automations" };

export default function AutomationsPage() {
  return (
    <ConsoleView label="Automations">
      <Page className="x-auto">
        <AutomationsList />
      </Page>
    </ConsoleView>
  );
}
