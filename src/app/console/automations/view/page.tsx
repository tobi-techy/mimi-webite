import type { Metadata } from "next";
import { Suspense } from "react";
import { USES_API } from "@/features/console/api/config";
import { AutoDetailRoute } from "@/features/console/components/automations/AutoDetailRoute";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Automation" };

/** Automations made in this demo session (?id=), like /console/threads/new?id=. */
export default function AutomationViewPage() {
  if (USES_API) return <NotAvailable title="Automation" />;
  return (
    <ConsoleView label="Automation">
      <Page className="x-auto">
        <Suspense fallback={null}>
          <AutoDetailRoute />
        </Suspense>
      </Page>
    </ConsoleView>
  );
}
