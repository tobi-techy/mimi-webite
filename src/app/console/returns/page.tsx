import type { Metadata } from "next";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { ReturnsView } from "@/features/console/components/returns/ReturnsView";
import { Page } from "@/features/console/components/ui/Page";
import { PageMenu } from "@/features/console/components/ui/PageMenu";

export const metadata: Metadata = { title: "Returns" };

/** Returns: where each one is, what came back, and the credit that closes it. */
export default function ReturnsPage() {
  return (
    <ConsoleView label="Returns">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Returns</h1>
          <PageMenu page="Returns" />
        </div>
        <p className="x-sub">Stock coming back, where it has got to, and what it is worth to the shop.</p>
        <ReturnsView />
      </Page>
    </ConsoleView>
  );
}
