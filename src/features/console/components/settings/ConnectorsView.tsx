"use client";

import { useCallback, useMemo, useState } from "react";
import { ConnectorLogo } from "@/features/console/components/settings/ConnectorLogo";
import { ConnectorModal } from "@/features/console/components/settings/ConnectorModal";
import { ConnectorStatus } from "@/features/console/components/settings/ConnectorStatus";
import { ConnectorTable } from "@/features/console/components/settings/ConnectorTable";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Picker } from "@/features/console/components/ui/Picker";
import { SearchField } from "@/features/console/components/ui/SearchField";
import {
  connectors,
  featuredConnectors,
  introLogos,
  type Connector,
} from "@/features/console/content/connectors";
import { useConnected } from "@/features/console/hooks/use-connected";
import { useToast } from "@/features/console/hooks/use-toast";
import { findConnector } from "@/features/console/lib/connectors-store";
import { buttonClass } from "@/features/console/components/ui/Button";

const SORTS = ["Connected first", "A to Z"] as const;
type Sort = (typeof SORTS)[number];
const MENU_TOASTS: Record<string, string> = {
  Docs: "Opening connector docs",
  "Suggest a connector": "Thanks. Every suggestion is read.",
  Filters: "Filters: every category",
};
const byKey = (keys: readonly string[]) => keys.map(findConnector).filter((c): c is Connector => !!c);
const intro = byKey(introLogos);
const featured = byKey(featuredConnectors);

/** Settings > Connectors: connected tools, featured integrations and the full list. */
export function ConnectorsView() {
  const say = useToast();
  const connected = useConnected();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("Connected first");
  const [open, setOpen] = useState<Connector | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const query = q.trim().toLowerCase();
  const matches = useCallback(
    (c: Connector) => !query || `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(query),
    [query],
  );
  const onList = connectors.filter((c) => connected.has(c.key));
  const onShown = onList.filter(matches);
  const featShown = featured.filter(matches);
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
        <h1 className="x-title">Connectors</h1>
        <SearchField label="Search connectors" value={q} onChange={setQ} />
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
      <div className="x-intro">
        <div>
          <h3>Bring the tools your shops already use</h3>
          <p>Connect once and Mimi brings that context into every thread</p>
        </div>
        <div className="x-stack">
          {intro.map((c) => (
            <img key={c.key} src={c.logo} alt={c.name} width={36} height={36} />
          ))}
        </div>
      </div>
      {onShown.length > 0 && (
        <>
          <div className="x-sh">
            <h2>
              Connected <span>· {onList.length}</span>
            </h2>
          </div>
          <div className="x-cgrid">
            {onShown.map((c) => (
              <button key={c.key} type="button" className="x-card x-cc" onClick={() => setOpen(c)}>
                <ConnectorLogo connector={c} />
                <div>
                  <b>{c.name}</b>
                  <small>{c.description}</small>
                  <ConnectorStatus />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {featShown.length > 0 && (
        <>
          <div className="x-sh">
            <h2>Featured integrations</h2>
            <a className="x-link x-tm" href="#all-integrations">
              View all
            </a>
          </div>
          <div className="x-fgrid">
            {featShown.map((c) => (
              <button key={c.key} type="button" className="x-card x-fc" onClick={() => setOpen(c)}>
                <ConnectorLogo connector={c} />
                <b>{c.name}</b>
                <small>{c.description}</small>
                {connected.has(c.key) ? (
                  <ConnectorStatus />
                ) : (
                  <span className={buttonClass("secondary", "sm")}>Connect</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="x-sh" id="all-integrations">
        <h2>
          All integrations <span>· {all.length}</span>
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
        <EmptyState>No connectors match the current search</EmptyState>
      )}
      {open && <ConnectorModal connector={open} onClose={close} />}
    </>
  );
}
