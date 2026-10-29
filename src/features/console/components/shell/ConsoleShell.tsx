import type { ReactNode } from "react";
import { LIVE_SIGN_IN_READY, MIMI_MODE } from "@/features/console/api/config";
import { ToastProvider } from "@/features/console/components/feedback/ToastProvider";
import { LiveBridge } from "@/features/console/components/live/LiveBridge";
import { SignInScreen } from "@/features/console/components/live/SignInScreen";
import { AppearanceBoot } from "@/features/console/components/settings/AppearanceView";
import { ConsoleLoader } from "@/features/console/components/shell/ConsoleLoader";
import { SettingsNav } from "@/features/console/components/shell/SettingsNav";
import { ShellProvider } from "@/features/console/components/shell/ShellProvider";
import { SideNav } from "@/features/console/components/shell/SideNav";
import "@/features/console/styles/index.css";

/** The console demo chrome: sidebar (drawer on phones), main column, toasts, loader. */
export function ConsoleShell({ children }: { children: ReactNode }) {
  /* the live build stays closed until sign-in exists: no sidebar, no data, just the sign-in screen */
  if (MIMI_MODE === "live" && !LIVE_SIGN_IN_READY) {
    return (
      <>
        <SignInScreen />
        <AppearanceBoot />
      </>
    );
  }
  return (
    <ToastProvider>
      <ShellProvider sidebar={<SideNav settings={<SettingsNav />} />}>{children}</ShellProvider>
      <LiveBridge />
      <ConsoleLoader />
      <AppearanceBoot />
    </ToastProvider>
  );
}
