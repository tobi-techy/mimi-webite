"use client";

import { useState } from "react";
import { LineChart } from "@/features/console/components/charts/LineChart";
import { RadarChart } from "@/features/console/components/charts/RadarChart";
import { UsageShopsTable } from "@/features/console/components/usage/UsageShopsTable";
import { Icon } from "@/features/console/components/ui/Icon";
import { Picker } from "@/features/console/components/ui/Picker";
import { Segmented } from "@/features/console/components/ui/Segmented";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import {
  agentAxes,
  agentFilters,
  agentShare,
  usageRanges,
  usageSeries,
  usageTiles,
  type AgentFilter,
  type UsageRange,
} from "@/features/console/content/usage";
import { naira } from "@/features/console/lib/format";

const RUNS_THIS_MONTH = 1284;
const FILTER_ICON: Record<AgentFilter, IconName> = {
  "All helpers": "users",
  Collector: "receipt",
  Stock: "package",
  Order: "store",
  Credit: "landmark",
};
const radarLabel = `Helper breakdown, share of runs by type this month against last month: ${agentAxes
  .map(([n, c, p]) => `${n} ${c} (last month ${p})`)
  .join(", ")}`;

/** Settings > Billing > Usage: tiles, agent radar, runs over time and the shops table. */
export function UsageDashboard() {
  const [agent, setAgent] = useState<AgentFilter>("All helpers");
  const [range, setRange] = useState<UsageRange>("1m");
  const series = usageSeries(range, agent);
  const totalRuns = series.reduce((s, p) => s + p.runs, 0);
  const totalRecovered = series.reduce((s, p) => s + p.recovered, 0);

  return (
    <>
      <div className="x-uh">
        <div>
          <h1>Usage</h1>
          <p>
            Track how Mimi works for Coral Lane: runs, messages, money recovered and computer hours across every
            shop.
          </p>
        </div>
        <div className="x-ctl">
          <Picker
            variant="plain"
            label="Filter by agent"
            value={agent}
            onChange={(v) => setAgent(v as AgentFilter)}
            lead={<Icon name="filter" />}
            options={agentFilters.map((f) => ({
              value: f,
              icon: FILTER_ICON[f],
              section: f === "All helpers" ? "All" : "Agents",
            }))}
          />
        </div>
      </div>
      <div className="x-warn" role="note">
        <Icon name="triangle-alert" />
        <div>
          <b>Some shop data may be out of date</b>
          <p>
            3 of 48 shops haven&apos;t synced their stock book in over 7 days, so their numbers may lag. Ask
            Mimi to request a fresh photo.
          </p>
        </div>
      </div>
      <div className="x-ust">
        {usageTiles.map((t) => (
          <div key={t.label} className="x-utile">
            <span className="x-ulab">{t.label}</span>
            <span className="x-uval">
              {"scales" in t
                ? Math.round(RUNS_THIS_MONTH * agentShare[agent]).toLocaleString("en-US")
                : t.value}
              <small>{t.unit}</small>
            </span>
          </div>
        ))}
      </div>
      <div className="x-uc2">
        <div className="x-ucard">
          <div className="x-uch">
            <span className="x-ulab">Helper breakdown</span>
          </div>
          <p className="x-legend">
            <span>
              <i className="x-l1"></i>This month
            </span>
            <span>
              <i className="x-l3"></i>Last month
            </span>
          </p>
          <div className="x-ec x-ec--radar">
            <RadarChart axes={agentAxes} label={radarLabel} />
          </div>
        </div>
        <div className="x-ucard">
          <div className="x-uch">
            <span className="x-ulab">Runs over time</span>
            <Segmented
              label="Range"
              value={range}
              onChange={setRange}
              segments={usageRanges.map((r) => ({ value: r, label: r }))}
            />
          </div>
          <p className="x-legend">
            <span>
              <i className="x-l1"></i>Runs
            </span>
            <span>
              <i className="x-l2"></i>Money recovered
            </span>
          </p>
          <div className="x-ec">
            <LineChart
              label={`Runs over ${range}: ${totalRuns.toLocaleString("en-US")} in total, rising across the range, with ${naira(totalRecovered)} recovered`}
              points={series.map((p) => ({
                label: p.label,
                primary: p.runs,
                secondary: p.recovered,
                title: `${p.label}: ${p.runs.toLocaleString("en-US")} runs, ${naira(p.recovered)} recovered`,
              }))}
            />
          </div>
        </div>
      </div>
      <UsageShopsTable agent={agent} />
    </>
  );
}
