"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Identity } from "@/features/console/components/ui/Avatar";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { MiniBar } from "@/features/console/components/ui/Meter";
import { Picker } from "@/features/console/components/ui/Picker";
import { Pill } from "@/features/console/components/ui/Pill";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { shopHref } from "@/features/console/config";
import { routes, shopStatus, shops, type Route, type ShopStatus } from "@/features/console/content/shops";
import { naira } from "@/features/console/lib/format";
import { Table } from "@/features/console/components/ui/Table";

type RouteFilter = "All" | Route;
type StatusFilter = "All statuses" | (typeof shopStatus)[ShopStatus]["label"];
const SORTS = ["Highest owed first", "Lowest owed first"] as const;
type Sort = (typeof SORTS)[number];

const STATUS_OPTIONS = [
  { value: "All statuses", icon: "filter" as const },
  { value: "Good", detail: "Pays on time", lead: <span className="x-sd x-g"></span> },
  { value: "Watch", detail: "One late payment", lead: <span className="x-sd x-a"></span> },
  { value: "Overdue", detail: "Past due date", lead: <span className="x-sd x-r"></span> },
];

/** Every shop: search, route tabs, status filter and sort by outstanding. Rows open the shop. */
export function ShopsTable() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [route, setRoute] = useState<RouteFilter>("All");
  const [status, setStatus] = useState<StatusFilter>("All statuses");
  const [sort, setSort] = useState<Sort>("Highest owed first");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return shops
      .filter(
        (s) =>
          (route === "All" || s.route === route) &&
          (status === "All statuses" || shopStatus[s.status].label === status) &&
          (!query || `${s.name} ${s.area} ${s.owner}`.toLowerCase().includes(query)),
      )
      .sort((a, b) => (sort === "Lowest owed first" ? a.owed - b.owed : b.owed - a.owed));
  }, [q, route, status, sort]);

  return (
    <>
      <div className="x-ltools">
        <SearchField label="Search shops or owners" value={q} onChange={setQ} />
        <Segmented
          label="Route"
          value={route}
          onChange={setRoute}
          segments={(["All", ...routes] as const).map((r) => ({
            value: r,
            label: r,
            count: shops.filter((s) => r === "All" || s.route === r).length,
          }))}
        />
        <Picker
          variant="plain"
          label="Filter shops by status"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={STATUS_OPTIONS}
        />
        <span className="x-grow"></span>
        <Picker
          label="Sort shops by outstanding"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={SORTS.map((value) => ({ value, icon: "arrow-up-down" as const }))}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState>No shops match the current filters</EmptyState>
      ) : (
        <Table label="Shops">
          <thead>
            <tr>
              <th scope="col">Shop</th>
              <th scope="col">Owner</th>
              <th scope="col">Sell-through 7d</th>
              <th scope="col" className="r">
                Outstanding
              </th>
              <th scope="col">Score</th>
              <th scope="col">Last payment</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.id}
                className="is-link"
                onClick={() => router.push(shopHref(s.id), { scroll: false })}
              >
                <td>
                  <Link
                    href={shopHref(s.id)}
                    scroll={false}
                    aria-label={`Open ${s.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Identity name={s.name} sub={s.area} />
                  </Link>
                </td>
                <td>{s.owner}</td>
                <td>
                  <MiniBar percent={s.sellThrough} />
                  <span className="x-num">{s.sellThrough}%</span>
                </td>
                <td className="r x-ink">{naira(s.owed)}</td>
                <td className="x-num">
                  <span className="x-ink">{s.score}</span>
                  <span className="x-mu">/100</span>
                </td>
                <td>{s.lastPayment}</td>
                <td>
                  <Pill tone={shopStatus[s.status].tone}>{shopStatus[s.status].label}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
