import type { Metadata } from "next";
import { Suspense } from "react";
import { AutoDetailRoute } from "@/features/console/components/automations/AutoDetailRoute";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Automation" };

/** Automations made in this demo session (?id=), like /console/threads/new?id=. */
export default function AutomationViewPage() {
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
