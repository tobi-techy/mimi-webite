import type { Metadata } from "next";
import { CreditBoard, CreditHeadline } from "@/features/console/components/credit/CreditBoard";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Icon } from "@/features/console/components/ui/Icon";
import { PageMenu } from "@/features/console/components/ui/PageMenu";
import { USES_API } from "@/features/console/api/config";
import { ToastButton } from "@/features/console/components/ui/ToastButton";
import { CreditKpis } from "@/features/console/components/credit/CreditKpis";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Credit limits" };

export default function CreditPage() {
  return (
    <ConsoleView label="Credit limits">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Credit limits</h1>
          <PageMenu page="Credit limits" filters="every shop and route" />
            {/* no API route behind this button yet: the API build leaves it out */}
            {!USES_API && (
          <ToastButton variant="primary" message="Only Coral Lane can set limits. Draft saved.">
            <Icon name="plus" />
            New credit line
          </ToastButton>
            )}
        </div>
        <CreditHeadline />
        <CreditKpis />
        <CreditBoard />
      </Page>
    </ConsoleView>
  );
}
