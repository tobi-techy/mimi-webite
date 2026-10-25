import type { Metadata } from "next";
import { NeedsHome } from "@/features/console/components/needs/NeedsHome";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";

export const metadata: Metadata = { title: "Needs you" };

export default function ConsoleHomePage() {
  return (
    <ConsoleView className="mc-view-home" label="Needs you">
      <NeedsHome />
    </ConsoleView>
  );
}
