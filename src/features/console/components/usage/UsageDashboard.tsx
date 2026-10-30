"use client";

import { useState } from "react";
import { LineChart } from "@/features/console/components/charts/LineChart";
import { UsageShopsTable } from "@/features/console/components/usage/UsageShopsTable";
import { Icon } from "@/features/console/components/ui/Icon";
import { Picker } from "@/features/console/components/ui/Picker";
import { Segmented } from "@/features/console/components/ui/Segmented";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import {
  agentFilters,
  agentShare,
  usageRanges,
  usageSeries,
  usageTiles,
  type AgentFilter,
  type UsageRange,
} from "@/features/console/content/usage";
import { naira, nairaShort } from "@/features/console/lib/format";
import { ChartCard } from "@/features/console/components/ui/ChartCard";
import { TickMeter } from "@/features/console/components/ui/TickMeter";

const RUNS_THIS_MONTH = 1284;
const FILTER_ICON: Record<AgentFilter, IconName> = {
  "All helpers": "users",
  Collector: "receipt",
  Stock: "package",
  Order: "store",
  Credit: "landmark",
};

/** Settings > Billing > Usage: stat row with plan meters, the money-collected chart card and the shops table. */
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
            Track how Mimi works for Coral Lane: runs, messages, money recovered and computer hours across
            every shop.
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
      {/* v2 stat row (Leye's record page): grey label over value, no boxes, no filler tiles */}
      <dl className="v2-stats">
        {usageTiles
          /* plan usage only: "Money recovered" lives in the chart card below, "Last updated" was filler */
          .filter((t) => t.label === "Runs this month" || t.label === "Computer hours")
          .map((t) => (
            <div key={t.label}>
              <dt>{t.label}</dt>
              <dd>
                {"scales" in t
                  ? Math.round(RUNS_THIS_MONTH * agentShare[agent]).toLocaleString("en-US")
                  : t.value}
                <small>{t.unit}</small>
              </dd>
              {t.label === "Runs this month" && (
                <TickMeter
                  value={Math.round(RUNS_THIS_MONTH * agentShare[agent])}
                  max={2000}
                  label="Runs used of the 2,000 in the plan"
                />
              )}
              {t.label === "Computer hours" && (
                <TickMeter value={Number(t.value)} max={500} label="Computer hours used of 500" />
              )}
            </div>
          ))}
      </dl>
      <div className="x-uc2 v2-grid1">
        <ChartCard
          title="Money collected"
          sub="Money back from shops, with the runs it took"
          stats={[
            { label: "Collected", value: naira(totalRecovered), note: range },
          ]}
          filename={`money-collected-${range}`}
          legend={[
            { label: "Collected", tone: "s1" },
            { label: "Runs", tone: "s2" },
          ]}
          control={
            <Segmented
              label="Range"
              value={range}
              onChange={setRange}
              segments={usageRanges.map((r) => ({ value: r, label: r }))}
            />
          }
          table={{
            columns: ["Period", "Collected (₦)", "Runs"],
            align: ["left", "right", "right"],
            rows: series.map((p) => [
              p.label,
              p.recovered.toLocaleString("en-US"),
              p.runs.toLocaleString("en-US"),
            ]),
          }}
        >
          <LineChart
            area={false}
            format={(v) => (v === 0 ? "0" : nairaShort(v))}
            label={`Money collected over ${range}: ${naira(totalRecovered)} in total, with ${totalRuns.toLocaleString("en-US")} runs`}
            points={series.map((p) => ({
              label: p.label,
              primary: p.recovered,
              secondary: p.runs,
              title: `${p.label}: ${naira(p.recovered)} collected, ${p.runs.toLocaleString("en-US")} runs`,
            }))}
          />
        </ChartCard>
      </div>
      <UsageShopsTable agent={agent} />
    </>
  );
}
