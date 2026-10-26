import type { ReactNode } from "react";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { ShopsTable } from "@/features/console/components/shops/ShopsTable";
import { ButtonLink } from "@/features/console/components/ui/Button";
import { Icon } from "@/features/console/components/ui/Icon";
import { PageMenu } from "@/features/console/components/ui/PageMenu";
import { ToastButton } from "@/features/console/components/ui/ToastButton";
import { Page } from "@/features/console/components/ui/Page";
import { consoleRoutes } from "@/features/console/config";

/** The shops list stays mounted while a shop's drawer (/console/shops/[id]) opens over it. */
export default function ShopsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ConsoleView label="Shops">
        <Page wide>
          <div className="x-lhd">
            <h1 className="x-title">Shops</h1>
            <PageMenu page="Shops" />
            <ButtonLink href={consoleRoutes.credit}>
              <Icon name="landmark" />
              Credit limits
            </ButtonLink>
            <ToastButton variant="primary" message="Shop invite link copied">
              <Icon name="plus" />
              Add shop
            </ToastButton>
          </div>
          <p className="x-sub">48 shops · 41 on WhatsApp · ₦4.82m outstanding</p>
          <ShopsTable />
        </Page>
      </ConsoleView>
      {children}
    </>
  );
}
