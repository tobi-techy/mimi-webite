import type { Metadata } from "next";
import { USES_API } from "@/features/console/api/config";
import { RoutinesView } from "@/features/console/components/routines/RoutinesView";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { Page } from "@/features/console/components/ui/Page";
import { PageMenu } from "@/features/console/components/ui/PageMenu";

export const metadata: Metadata = { title: "Routines" };

/** Routines: the work Mimi does on her own, with its schedule and a pause. */
export default function RoutinesPage() {
  /* the sample build has no book to read: the screen only exists where the API does */
  if (!USES_API) return <NotAvailable title="Routines" what="The routines list" />;
  return (
    <ConsoleView label="Routines">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Routines</h1>
          <PageMenu page="Routines" />
        </div>
        <p className="x-sub">The work Mimi does on her own, when it runs, and what it found last time.</p>
        <RoutinesView />
      </Page>
    </ConsoleView>
  );
}
