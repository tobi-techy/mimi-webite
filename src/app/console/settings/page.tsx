import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SettingsSectionView } from "@/features/console/components/settings/SettingsSectionView";
import { USES_API } from "@/features/console/api/config";
import { findSettingsSection } from "@/features/console/content/settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const section = findSettingsSection(USES_API ? "connectors" : "general");
  if (!section) notFound();
  return <SettingsSectionView section={section} />;
}
