import type { Metadata } from "next";
import { Suspense } from "react";
import { AutoWizard } from "@/features/console/components/automations/AutoWizard";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";

export const metadata: Metadata = { title: "New automation" };

export default function NewAutomationPage() {
  return (
    <ConsoleView label="New automation">
      <Suspense fallback={null}>
        <AutoWizard />
      </Suspense>
    </ConsoleView>
  );
}
