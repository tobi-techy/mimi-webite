import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Button } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Note } from "@/features/console/components/ui/Note";
import { Page } from "@/features/console/components/ui/Page";

/**
 * The live build (NEXT_PUBLIC_MIMI_MODE=live) until sign-in exists: every console route shows
 * this and nothing is fetched. Closed by default, no access.
 */
export function SignInScreen() {
  return (
    <div className="mc-app">
      <main className="mc-main" id="main">
        <ConsoleView label="Sign in">
          <Page>
            <div className="x-lhd">
              <h1 className="x-title">Sign in to Mimi</h1>
              <Button variant="primary" disabled aria-disabled="true">
                Sign in
              </Button>
            </div>
            <EmptyState>Sign-in is not open yet. Your Mimi console opens here once it is.</EmptyState>
            <Note>Nothing from your business is shown or stored on this page.</Note>
          </Page>
        </ConsoleView>
      </main>
    </div>
  );
}
