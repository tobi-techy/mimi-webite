import { ButtonLink } from "@/features/console/components/ui/Button";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { Page } from "@/features/console/components/ui/Page";
import { consoleRoutes } from "@/features/console/config";

/**
 * A console area the API build does not run yet. The route stays (so a stale link or a typed URL
 * lands somewhere honest) but shows a plain note instead of sample data. Used by the sample-only
 * routes (automations, shop lists) so nothing fake renders in the API build.
 */
export function NotAvailable({
  title,
  what = "This part of the console",
  back = { href: consoleRoutes.home, label: "Back to Mimi" },
}: {
  title: string;
  what?: string;
  back?: { href: string; label: string };
}) {
  return (
    <ConsoleView label={title}>
      <Page>
        <div className="x-shead">
          <h1 className="x-title">{title}</h1>
        </div>
        <p className="x-sub">
          Not available yet. {what} isn&apos;t connected to Mimi, so nothing here would be saved.
        </p>
        <ButtonLink href={back.href}>{back.label}</ButtonLink>
      </Page>
    </ConsoleView>
  );
}
