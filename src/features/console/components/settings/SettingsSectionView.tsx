import { ComputersGrid } from "@/features/console/components/computers/ComputersGrid";
import { AppearanceView } from "@/features/console/components/settings/AppearanceView";
import { ConnectorsView } from "@/features/console/components/settings/ConnectorsView";
import { ProvidersTable } from "@/features/console/components/settings/ProvidersTable";
import { SettingControl } from "@/features/console/components/settings/SettingControl";
import { ConsoleView } from "@/features/console/components/shell/ConsoleView";
import { UsageDashboard } from "@/features/console/components/usage/UsageDashboard";
import { Icon } from "@/features/console/components/ui/Icon";
import { Note } from "@/features/console/components/ui/Note";
import { Page } from "@/features/console/components/ui/Page";
import { Row } from "@/features/console/components/ui/Row";
import { ToastButton } from "@/features/console/components/ui/ToastButton";
import type { SettingsSection } from "@/features/console/content/settings";

/** One settings screen. Connectors and Usage have their own views; the rest are rows. */
export function SettingsSectionView({ section }: { section: SettingsSection }) {
  return (
    <ConsoleView label={section.title}>
      <Page className="x-set">
        {section.id === "connectors" ? (
          <ConnectorsView />
        ) : section.id === "usage" ? (
          <UsageDashboard />
        ) : section.id === "appearance" ? (
          <AppearanceView />
        ) : (
          <>
            <div className="x-shead">
              <h1 className="x-title">{section.title}</h1>
              {section.action && (
                <ToastButton
                  variant={section.action.primary ? "primary" : "secondary"}
                  message={section.action.toast}
                >
                  {section.action.primary && <Icon name="plus" />}
                  {section.action.label}
                </ToastButton>
              )}
            </div>
            {section.sub && <p className="x-sub">{section.sub}</p>}
            {section.id === "computers" && (
              <>
                <ComputersGrid />
                <Note>Shop data never lives on a computer. Money never moves from one.</Note>
              </>
            )}
            {section.groups.map((g) => (
              <section key={g.title} aria-label={g.title} className="x-sg">
                <h2 className="x-sg__h">{g.title}</h2>
                {"providers" in g ? (
                  <ProvidersTable />
                ) : (
                  g.rows.map((r) => (
                    <Row key={r.title} title={r.title} description={r.detail} avatar={r.avatar}>
                      {r.control && <SettingControl control={r.control} label={r.title} />}
                    </Row>
                  ))
                )}
              </section>
            ))}
          </>
        )}
      </Page>
    </ConsoleView>
  );
}
