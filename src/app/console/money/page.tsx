import type { Metadata } from "next";
import { USES_API } from "@/features/console/api/config";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { MoneyAtRisk } from "@/features/console/components/money/MoneyAtRisk";
import { Page } from "@/features/console/components/ui/Page";
import { PageMenu } from "@/features/console/components/ui/PageMenu";

export const metadata: Metadata = { title: "Money at risk" };

/** Money at risk: the morning screen for visibility and credit exposure. */
export default function MoneyPage() {
  /* the sample build has no book to read: the screen only exists where the API does */
  if (!USES_API) return <NotAvailable title="Money at risk" what="This screen reads Coral Lane's live book" />;
  return (
    <ConsoleView label="Money at risk">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Money at risk</h1>
          <PageMenu page="Money at risk" />
        </div>
        <p className="x-sub">What Coral Lane is owed, how old it is, and which shops are carrying it.</p>
        <MoneyAtRisk />
      </Page>
    </ConsoleView>
  );
}
