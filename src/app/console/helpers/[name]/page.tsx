import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelperView } from "@/features/console/components/helpers/HelperView";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";
import { rosterNames, type RosterName } from "@/features/console/demo/roster";

type Props = { params: Promise<{ name: string }> };

export const dynamicParams = false;

const byKey = (k: string): RosterName | undefined => rosterNames.find((n) => n.toLowerCase() === k);

export function generateStaticParams() {
  return rosterNames.map((n) => ({ name: n.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: byKey((await params).name) ?? "Helper" };
}

/** One helper's own view: what she is doing, her cost today, her routines and threads. */
export default async function HelperPage({ params }: Props) {
  const name = byKey((await params).name);
  if (!name) notFound();
  return (
    <ConsoleView label={name}>
      <Page>
        <HelperView name={name} />
      </Page>
    </ConsoleView>
  );
}
