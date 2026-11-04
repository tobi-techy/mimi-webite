import type { Metadata } from "next";
import { USES_API } from "@/features/console/api/config";
import { BooksView } from "@/features/console/components/money/BooksCompare";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { Page } from "@/features/console/components/ui/Page";
import { PageMenu } from "@/features/console/components/ui/PageMenu";

export const metadata: Metadata = { title: "Two books" };

/** Two books: what Mimi's book says Coral Lane is owed, against what Zoho Books reports. */
export default function BooksPage() {
  /* the sample build has no book to read: the screen only exists where the API does */
  if (!USES_API) return <NotAvailable title="Two books" what="The Zoho Books connection" />;
  return (
    <ConsoleView label="Two books">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Two books</h1>
          <PageMenu page="Two books" />
        </div>
        <p className="x-sub">Mimi&apos;s book against Zoho Books.</p>
        <BooksView />
      </Page>
    </ConsoleView>
  );
}
