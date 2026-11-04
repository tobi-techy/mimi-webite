import type { Metadata } from "next";
import { TaskList } from "@/features/console/components/computers/TaskList";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Computer tasks" };

export default function ComputerTasksPage() {
  return (
    <ConsoleView label="Computer tasks">
      <Page>
        <TaskList />
      </Page>
    </ConsoleView>
  );
}
