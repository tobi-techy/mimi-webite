import type { Metadata } from "next";
import { Suspense } from "react";
import { USES_API } from "@/features/console/api/config";
import { AutoWizard } from "@/features/console/components/automations/AutoWizard";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";

export const metadata: Metadata = { title: "New automation" };

export default function NewAutomationPage() {
  if (USES_API) return <NotAvailable title="New automation" />;
  return (
    <ConsoleView label="New automation">
      <Suspense fallback={null}>
        <AutoWizard />
      </Suspense>
    </ConsoleView>
  );
}
