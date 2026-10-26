import { RootDocument } from "@/components/layout/RootDocument";
import { ConsoleShell } from "@/features/console/components/shell/ConsoleShell";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { ButtonLink } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Page } from "@/features/console/components/ui/Page";
import { consoleRoutes } from "@/features/console/config";

/**
 * The 404 of the console-only build (console.userail.money), which has no marketing pages to fall
 * back on. scripts/build-console.mjs mounts it as that build's app/global-not-found.tsx.
 */
export function ConsoleNotFound() {
  return (
    <RootDocument>
      <ConsoleShell>
        <ConsoleView label="Not found">
          <Page>
            <div className="x-lhd">
              <h1 className="x-title">Page not found</h1>
              <ButtonLink variant="primary" href={consoleRoutes.home}>
                Back to Mimi
              </ButtonLink>
            </div>
            <EmptyState>Nothing lives at this address in the demo.</EmptyState>
          </Page>
        </ConsoleView>
      </ConsoleShell>
    </RootDocument>
  );
}
