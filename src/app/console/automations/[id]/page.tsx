import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USES_API } from "@/features/console/api/config";
import { AutoDetail } from "@/features/console/components/automations/AutoDetail";
import { NotAvailable } from "@/features/console/components/shell/NotAvailable";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";
import { seedAutomationsList } from "@/features/console/content/automations";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
const all = seedAutomationsList();

export function generateStaticParams() {
  return all.map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (USES_API) return { title: "Automations" };
  const id = (await params).id;
  return { title: `${all.find((a) => a.id === id)?.title ?? "Automation"} · Automations` };
}

export default async function AutomationPage({ params }: Props) {
  if (USES_API) return <NotAvailable title="Automations" />;
  const id = (await params).id;
  if (!all.some((a) => a.id === id)) notFound();
  return (
    <ConsoleView label="Automation">
      <Page className="x-auto">
        <AutoDetail id={id} />
      </Page>
    </ConsoleView>
  );
}
