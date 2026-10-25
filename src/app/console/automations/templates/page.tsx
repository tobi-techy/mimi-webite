import type { Metadata } from "next";
import { TemplatesGallery } from "@/features/console/components/automations/TemplatesGallery";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Templates · Automations" };

export default function AutomationTemplatesPage() {
  return (
    <ConsoleView label="Automation templates">
      <Page className="x-auto">
        <TemplatesGallery />
      </Page>
    </ConsoleView>
  );
}
