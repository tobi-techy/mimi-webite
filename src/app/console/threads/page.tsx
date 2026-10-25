import type { Metadata } from "next";
import { ThreadIndex } from "@/features/console/components/chat/ThreadIndex";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { ButtonLink } from "@/features/console/components/ui/Button";
import { Icon } from "@/features/console/components/ui/Icon";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Threads" };

export default function ThreadsPage() {
  return (
    <ConsoleView label="Threads">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Threads</h1>
          <ButtonLink variant="primary" href="/console#new">
            <Icon name="plus" />
            New thread
          </ButtonLink>
        </div>
        <ThreadIndex />
      </Page>
    </ConsoleView>
  );
}
