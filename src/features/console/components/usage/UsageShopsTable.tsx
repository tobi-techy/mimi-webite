"use client";

import { useState } from "react";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import { Icon } from "@/features/console/components/ui/Icon";
import { Picker } from "@/features/console/components/ui/Picker";
import { SearchField } from "@/features/console/components/ui/SearchField";
import {
  USAGE_PAGE_SIZE,
  usageShops,
  type AgentFilter,
  type UsageShop,
} from "@/features/console/content/usage";
import { useToast } from "@/features/console/hooks/use-toast";
import { cx } from "@/lib/cx";
import { Chip } from "@/features/console/components/ui/Chip";
import { Table } from "@/features/console/components/ui/Table";

const TICKS = 12;
const HEX = "14,2 24.4,8 24.4,20 14,26 3.6,20 3.6,8";

const matchesAgent = (s: UsageShop, f: AgentFilter): boolean =>
  f === "All helpers" ||
  (f === "Collector" ? s.level > 0 : f === "Order" ? s.level === 0 : s.tags.includes(f));

function downloadCsv(rows: readonly UsageShop[]): void {
  const cell = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const lines = rows.map((r) =>
    [r.level || "", r.name, r.owner, r.route, `${r.progress}%`, r.ago, r.tags.join(" ")].map(cell).join(","),
  );
  const blob = new Blob([["Level,Shop,Owner,Route,Progress,Last run,Tags", ...lines].join("\n")], {
    type: "text/csv",
  });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: "mimi-usage-shops.csv",
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Usage > Shops: level, progress and last run per shop, with search, paging, flags and CSV export. */
export function UsageShopsTable({ agent }: { agent: AgentFilter }) {
  const say = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [flagged, setFlagged] = useState<ReadonlySet<number>>(new Set());
  const [rerun, setRerun] = useState<ReadonlySet<number>>(new Set());

  const query = q.trim().toLowerCase();
  const rows = usageShops.filter(
    (s) =>
      matchesAgent(s, agent) && (!query || `${s.name} ${s.owner} ${s.route}`.toLowerCase().includes(query)),
  );
  const pages = Math.max(1, Math.ceil(rows.length / USAGE_PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * USAGE_PAGE_SIZE, current * USAGE_PAGE_SIZE);

  function act(s: UsageShop, action: string) {
    if (action === "Re-run") {
      setRerun(new Set(rerun).add(s.id));
      say(`Re-running ${s.name}`);
    } else if (action === "Analyze") say(`Mimi is analyzing ${s.name}`);
    else {
      const next = new Set(flagged);
      const on = !next.delete(s.id);
      if (on) next.add(s.id);
      setFlagged(next);
      say(`${s.name} ${on ? "flagged for review" : "unflagged"}`);
    }
  }

  return (
    <div className="x-ucard x-utbl">
      <div className="x-uch">
        <span className="x-ulab">Shops · {rows.length}</span>
        <SearchField
          label="Search shops"
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
        />
        <Picker
          label="Shop table actions"
          options={[{ value: "Export CSV", icon: "download" }]}
          onChange={() => {
            downloadCsv(rows);
            say(`Exported ${rows.length} shops to CSV`);
          }}
        />
      </div>
      {rows.length === 0 ? (
        <div className="x-pad">
          <EmptyState>No shops match the current search</EmptyState>
        </div>
      ) : (
        <>
          <Table bare label="Usage by shop">
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">Shop</th>
                <th scope="col">Progress</th>
                <th scope="col">Last run</th>
                <th scope="col">Tags</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const on = Math.round((s.progress / 100) * TICKS);
                const isFlagged = flagged.has(s.id);
                return (
                  <tr key={s.id}>
                    <td>
                      <svg
                        className="x-lv"
                        viewBox="0 0 28 28"
                        role="img"
                        aria-label={s.level ? `Level ${s.level}` : "No level"}
                      >
                        <polygon points={HEX} className={s.level ? "x-lv-on" : "x-lv-off"} />
                        {s.level > 0 && (
                          <text x="14" y="18" textAnchor="middle">
                            {s.level}
                          </text>
                        )}
                      </svg>
                    </td>
                    <td>
                      <span className="x-n">
                        <ShopAvatar name={s.name} size={20} className="x-n__av" />
                        {s.name}
                        {isFlagged && (
                          <>
                            {" "}
                            <span className="x-ta" role="img" aria-label="Flagged">
                              <Icon name="flag" />
                            </span>
                          </>
                        )}
                      </span>
                      <span className="x-ar">
                        {s.owner} · {s.route}
                      </span>
                    </td>
                    <td>
                      <span className="x-ticks" aria-hidden="true">
                        {Array.from({ length: TICKS }, (_, j) => (
                          <i key={j} className={cx(j < on && "on")}></i>
                        ))}
                      </span>
                      <span className="x-num x-ink">{s.progress}%</span>
                    </td>
                    <td className="x-mu x-num">{rerun.has(s.id) ? "just now" : s.ago}</td>
                    <td>
                      {s.tags.map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </td>
                    <td className="r">
                      <Picker
                        label={`More for ${s.name}`}
                        options={[
                          { value: s.progress >= 50 ? "Re-run" : "Analyze", icon: "refresh-cw" },
                          { value: isFlagged ? "Unflag" : "Flag for review", icon: "flag" },
                        ]}
                        onChange={(a) => act(s, a)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <nav className="x-pg" aria-label="Pages">
            <button
              type="button"
              aria-label="Previous page"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              <Icon name="chevron-left" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={cx(n === current && "is-on")}
                aria-current={n === current ? "page" : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              <Icon name="chevron-right" />
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
