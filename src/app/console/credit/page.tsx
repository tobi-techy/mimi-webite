import type { Metadata } from "next";
import Link from "next/link";
import { CreditBoard } from "@/features/console/components/credit/CreditBoard";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Icon } from "@/features/console/components/ui/Icon";
import { PageMenu } from "@/features/console/components/ui/PageMenu";
import { USES_API } from "@/features/console/api/config";
import { ToastButton } from "@/features/console/components/ui/ToastButton";
import { CreditKpis } from "@/features/console/components/credit/CreditKpis";
import { Page } from "@/features/console/components/ui/Page";
import { consoleRoutes } from "@/features/console/config";

export const metadata: Metadata = { title: "Credit" };

export default function CreditPage() {
  return (
    <ConsoleView label="Credit">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Credit</h1>
          <PageMenu page="Credit" filters="every shop and route" />
            {/* no API route behind this button yet: the API build leaves it out */}
            {!USES_API && (
          <ToastButton variant="primary" message="Only Coral Lane can set limits. Draft saved.">
            <Icon name="plus" />
            New credit line
          </ToastButton>
            )}
        </div>
        <p className="x-sub">
          <Link href={consoleRoutes.shops}>Shops</Link> · Coral Lane sets every limit. Mimi recommends.
        </p>
        <CreditKpis />
        <CreditBoard />
      </Page>
    </ConsoleView>
  );
}
