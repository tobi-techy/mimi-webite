"use client";

import { useState } from "react";
import { ColumnChart } from "@/features/console/components/charts/ColumnChart";
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
import { naira } from "@/features/console/lib/format";
import { ChartCard } from "@/features/console/components/ui/ChartCard";
import { TickMeter } from "@/features/console/components/ui/TickMeter";

const RUNS_THIS_MONTH = 1284;
/** Axis ticks: "₦500k", "₦1m", "₦1.5m" (no trailing zeros on a quiet axis). */
const axisNaira = (v: number): string =>
  v === 0 ? "0" : v >= 1e6 ? `₦${+(v / 1e6).toFixed(1)}m` : `₦${Math.round(v / 1e3)}k`;
/** What each range's bars are, in the card's one quiet line. */
const RANGE_SUB: Record<UsageRange, string> = {
  "7d": "By day, last 7 days",
  "1m": "By week, last month",
  "6m": "By month, last 6 months",
  "1y": "By month, last year",
  All: "By quarter, since you joined",
};
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
          sub={RANGE_SUB[range]}
          figure={naira(totalRecovered)}
          filename={`money-collected-${range}`}
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
            rows: series.map((p) => [p.label, p.recovered, p.runs]),
          }}
        >
          <ColumnChart
            format={axisNaira}
            label={`Money collected, ${RANGE_SUB[range].toLowerCase()}: ${naira(totalRecovered)} in total, with ${totalRuns.toLocaleString("en-US")} runs`}
            columns={series.map((p) => ({
              label: p.label,
              value: p.recovered,
              title: `${p.label}: ${naira(p.recovered)} collected, ${p.runs.toLocaleString("en-US")} runs`,
            }))}
          />
        </ChartCard>
      </div>
      <UsageShopsTable agent={agent} />
    </>
  );
}
