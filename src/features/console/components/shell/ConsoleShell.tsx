import type { ReactNode } from "react";
import { ToastProvider } from "@/features/console/components/feedback/ToastProvider";
import { AppearanceBoot } from "@/features/console/components/settings/AppearanceView";
import { ConsoleLoader } from "@/features/console/components/shell/ConsoleLoader";
import { SettingsNav } from "@/features/console/components/shell/SettingsNav";
import { ShellProvider } from "@/features/console/components/shell/ShellProvider";
import { SideNav } from "@/features/console/components/shell/SideNav";
import "@/features/console/styles/index.css";

/** The console demo chrome: sidebar (drawer on phones), main column, toasts, loader. */
export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ShellProvider sidebar={<SideNav settings={<SettingsNav />} />}>{children}</ShellProvider>
      <ConsoleLoader />
      <AppearanceBoot />
    </ToastProvider>
  );
}
