import type { Metadata } from "next";
import { NewTaskForm } from "@/features/console/components/computers/NewTaskForm";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "New computer task" };

export default function NewComputerTaskPage() {
  return (
    <ConsoleView label="New computer task">
      <Page>
        <NewTaskForm />
      </Page>
    </ConsoleView>
  );
}
