"use client";

import { useCallback, useMemo, useState } from "react";
import { USES_API } from "@/features/console/api/config";
import { LiveConnectorsView } from "@/features/console/components/settings/LiveConnectorsView";
import { ConnectorLogo } from "@/features/console/components/settings/ConnectorLogo";
import { ConnectorModal } from "@/features/console/components/settings/ConnectorModal";
import { ConnectorTable } from "@/features/console/components/settings/ConnectorTable";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { Picker } from "@/features/console/components/ui/Picker";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { connectorCategories, connectors, type Connector } from "@/features/console/content/connectors";
import { useConnected } from "@/features/console/hooks/use-connected";
import { useToast } from "@/features/console/hooks/use-toast";

const SORTS = ["Connected first", "A to Z"] as const;
type Sort = (typeof SORTS)[number];
type View = "Apps" | "List";
const MENU_TOASTS: Record<string, string> = {
  Docs: "Opening connector docs",
  "Suggest a connector": "Thanks. Every suggestion is read.",
  Filters: "Filters: every category",
};

/** One tool as a card: logo, name, Beta tag, a check when connected or a + to connect; one muted line under it. */
function AppCard({ c, on, onOpen }: { c: Connector; on: boolean; onOpen: (c: Connector) => void }) {
  return (
    <button type="button" className="x-app" onClick={() => onOpen(c)} aria-label={`${c.name}${on ? ", connected" : ", connect"}`}>
      <span className="x-app__h">
        <ConnectorLogo connector={c} size="s" />
        <b>{c.name}</b>
        {c.beta && <span className="x-tag">Beta</span>}
        <span className="x-app__end" aria-hidden="true">
          {on ? (
            <span className="x-app__ok">
              <Icon name="check" />
            </span>
          ) : (
            <span className="x-app__add">
              <Icon name="plus" />
            </span>
          )}
        </span>
      </span>
      <small>{on ? `Connected · ${c.description}` : c.description}</small>
    </button>
  );
}

/** Settings > Connected tools. The API build reads the API (LiveConnectorsView); the sample build shows sample tools. */
export function ConnectorsView() {
  return USES_API ? <LiveConnectorsView /> : <SampleConnectorsView />;
}

/** Sample build only: an Apps-style grid (Needs action first, then by category) or the full table. */
function SampleConnectorsView() {
  const say = useToast();
  const connected = useConnected();
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("Apps");
  const [sort, setSort] = useState<Sort>("Connected first");
  const [open, setOpen] = useState<Connector | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const query = q.trim().toLowerCase();
  const matches = useCallback(
    (c: Connector) => !query || `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(query),
    [query],
  );
  const onCount = connectors.filter((c) => connected.has(c.key)).length;
  const needs = connectors.filter((c) => c.needs && connected.has(c.key) && matches(c));
  const groups = connectorCategories
    .map((cat) => ({ cat, items: connectors.filter((c) => c.category === cat && matches(c)) }))
    .filter((g) => g.items.length);
  const all = useMemo(
    () =>
      connectors
        .filter(matches)
        .sort((a, b) =>
          sort === "A to Z"
            ? a.name.localeCompare(b.name)
            : Number(connected.has(b.key)) - Number(connected.has(a.key)),
        ),
    [matches, sort, connected],
  );

  return (
    <>
      <div className="x-shead">
        <h1 className="x-title">Connected tools</h1>
        <SearchField label="Search tools" value={q} onChange={setQ} />
        <Picker
          label="More actions"
          options={[
            { value: "Docs", icon: "book-open" },
            { value: "Suggest a connector", icon: "plus" },
            { value: "Filters", icon: "filter" },
          ]}
          onChange={(v) => say(MENU_TOASTS[v] ?? v)}
        />
      </div>
      <p className="x-sub">Bring the tools your shops already use. Mimi reads them in every thread.</p>
      <div className="x-ptabs">
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          segments={[
            { value: "Apps", label: "Apps" },
            { value: "List", label: "List", count: all.length },
          ]}
        />
        <span className="x-tm x-ptabs__meta">{onCount} connected</span>
      </div>

      {view === "Apps" ? (
        <>
          {needs.length > 0 && (
            <section className="x-ag" aria-label="Needs action">
              <h2 className="x-ag__h">
                <Icon name="triangle-alert" className="x-ag__warn" />
                Needs action
              </h2>
              <div className="x-ag__rows">
                {needs.map((c) => (
                  <button key={c.key} type="button" className="x-app x-app--row" onClick={() => setOpen(c)}>
                    <ConnectorLogo connector={c} size="s" />
                    <b>{c.name}</b>
                    <small>{c.needs}</small>
                    <span className="x-app__cta" aria-hidden="true">
                      Reconnect
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {groups.map((g) => (
            <section key={g.cat} className="x-ag" aria-label={g.cat}>
              <h2 className="x-ag__h">{g.cat}</h2>
              <div className="x-ag__grid">
                {g.items.map((c) => (
                  <AppCard key={c.key} c={c} on={connected.has(c.key)} onOpen={setOpen} />
                ))}
              </div>
            </section>
          ))}
          {!groups.length && <EmptyState>No tools match the current search</EmptyState>}
        </>
      ) : (
        <>
          <div className="x-sh" id="all-integrations">
            <h2>
              All tools <span>· {all.length}</span>
            </h2>
            <Picker
              label="Sort connectors"
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              options={SORTS.map((value) => ({ value, icon: "arrow-up-down" as const }))}
            />
          </div>
          {all.length ? (
            <ConnectorTable items={all} onOpen={setOpen} />
          ) : (
            <EmptyState>No tools match the current search</EmptyState>
          )}
        </>
      )}
      {open && <ConnectorModal connector={open} onClose={close} />}
    </>
  );
}
