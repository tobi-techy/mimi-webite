import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutoDetail } from "@/features/console/components/automations/AutoDetail";
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
  const id = (await params).id;
  return { title: `${all.find((a) => a.id === id)?.title ?? "Automation"} · Automations` };
}

export default async function AutomationPage({ params }: Props) {
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
