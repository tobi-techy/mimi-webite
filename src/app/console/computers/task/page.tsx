import type { Metadata } from "next";
import { Suspense } from "react";
import { TaskDetailRoute } from "@/features/console/components/computers/TaskDetailRoute";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Computer task" };

/** One task, opened by id in the query (?id=…), like /console/automations/view?id=… */
export default function ComputerTaskPage() {
  return (
    <ConsoleView label="Computer task">
      <Page>
        <Suspense fallback={null}>
          <TaskDetailRoute />
        </Suspense>
      </Page>
    </ConsoleView>
  );
}
