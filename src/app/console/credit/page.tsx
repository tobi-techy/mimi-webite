import type { Metadata } from "next";
import Link from "next/link";
import { CreditBoard } from "@/features/console/components/credit/CreditBoard";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Icon } from "@/features/console/components/ui/Icon";
import { PageMenu } from "@/features/console/components/ui/PageMenu";
import { ToastButton } from "@/features/console/components/ui/ToastButton";
import { creditKpis } from "@/features/console/content/credit";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Credit" };

export default function CreditPage() {
  return (
    <ConsoleView label="Credit">
      <Page>
        <div className="x-lhd">
          <h1 className="x-title">Credit</h1>
          <PageMenu page="Credit" filters="every shop and route" />
          <ToastButton variant="primary" message="Only Wigmore can set limits. Draft saved.">
            <Icon name="plus" />
            New credit line
          </ToastButton>
        </div>
        <p className="x-sub">
          <Link href="/console/shops">Shops</Link> · Wigmore sets every limit. Mimi recommends.
        </p>
        <div className="x-kpis">
          {creditKpis.map((k) => (
            <div key={k.label} className="x-kpi">
              <b>{k.value}</b>
              <span>{k.label}</span>
            </div>
          ))}
        </div>
        <CreditBoard />
      </Page>
    </ConsoleView>
  );
}
