import type { Metadata } from "next";
import { Suspense } from "react";
import { CommandHome } from "@/features/console/components/command/CommandHome";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";

export const metadata: Metadata = { title: "Channels" };

/**
 * Channels: where the distributor's day happens (docs/PHASE1-COMMAND.md). The backend routes for
 * channels, items and the digest do not exist yet, so this reads a typed preview behind the same
 * client seam; the screen says so in plain words. `Suspense` is needed because the selected channel
 * travels in the query, which keeps the static export happy.
 */
export default function CommandPage() {
  return (
    <ConsoleView label="Channels">
      <Page wide>
        <div className="x-lhd">
          <h1 className="x-title">Channels</h1>
        </div>
        <Suspense fallback={null}>
          <CommandHome />
        </Suspense>
      </Page>
    </ConsoleView>
  );
}
