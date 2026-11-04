import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USES_API } from "@/features/console/api/config";
import { SettingsSectionView } from "@/features/console/components/settings/SettingsSectionView";
import { findSettingsSection, settingsSections } from "@/features/console/content/settings";

type Props = { params: Promise<{ section: string }> };

export const dynamicParams = false;

/**
 * General lives at /console/settings; every other section has its own path. In the API build
 * /settings opens Connected tools, so /settings/general exists too: it must show the honest
 * "Not available yet" note rather than a 404.
 */
export function generateStaticParams() {
  return settingsSections.filter((s) => s.id !== "general" || USES_API).map((s) => ({ section: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = findSettingsSection((await params).section);
  return { title: section ? `${section.title} · Settings` : "Settings" };
}

export default async function SettingsSectionPage({ params }: Props) {
  const section = findSettingsSection((await params).section);
  if (!section) notFound();
  return <SettingsSectionView section={section} />;
}
