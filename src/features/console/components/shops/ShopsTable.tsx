"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { Identity } from "@/features/console/components/ui/Avatar";
import { BookUnreachable } from "@/features/console/components/live/BookUnreachable";
import { MiniBar, ScoreTicks } from "@/features/console/components/ui/Meter";
import { Picker } from "@/features/console/components/ui/Picker";
import { Pill } from "@/features/console/components/ui/Pill";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { shopHref } from "@/features/console/config";
import { useShops } from "@/features/console/api/hooks";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { routes as sampleRoutes, shopStatus, type Route, type ShopStatus } from "@/features/console/content/shops";
import { naira } from "@/features/console/lib/format";
import { Table } from "@/features/console/components/ui/Table";
import { ShopsCharts } from "@/features/console/components/shops/ShopsCharts";

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
  const { shops, loading } = useShops();
  /* sample shops use the three routes; shops from the API are grouped by their rep */
  const routes = useMemo(
    () => (shops.some((s) => s.live) ? [...new Set(shops.map((s) => s.route))].sort() : sampleRoutes),
    [shops],
  );
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
  }, [shops, q, route, status, sort]);

  /* Show a column only when at least one shop in the book has a real value for it: the API has no
     sell-through, score or payment date, so those columns would read as a wall of dashes. Computed
     over the whole book, not the filtered rows, so filtering never changes the shape of the table. */
  const show = useMemo(
    () => ({
      sellThrough: shops.some((s) => !s.live),
      score: shops.some((s) => !s.live),
      lastPayment: shops.some((s) => Boolean(s.lastPayment) && s.lastPayment !== "—"),
      limit: shops.some((s) => (s.live?.creditLimit ?? 0) > 0),
      late: shops.some((s) => s.live?.overdueDays != null),
    }),
    [shops],
  );

  return (
    <>
      {!loading && <ShopsCharts shops={shops} />}
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
      {loading ? (
        <SkeletonRows count={8} />
      ) : rows.length === 0 ? (
        <BookUnreachable empty={shops.length ? "No shops match the current filters" : "No shops in this book yet"} />
      ) : (
        <Table label="Shops">
          <thead>
            <tr>
              <th scope="col" className="x-st-shop">Shop</th>
              {show.sellThrough && <th scope="col">Sell-through 7d</th>}
              <th scope="col" className="r">
                Owes
              </th>
              {show.late && (
                <th scope="col" className="r">
                  Late
                </th>
              )}
              {show.score && <th scope="col">Score</th>}
              {show.lastPayment && <th scope="col">Last payment</th>}
              <th scope="col">Status</th>
              <th scope="col" className="r" aria-label="Open"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr
                key={s.id}
                className="is-link x-row-in"
                style={{ "--i": Math.min(i, 14) } as CSSProperties}
                onClick={() => router.push(shopHref(s.id), { scroll: false })}
              >
                <td>
                  <Link
                    href={shopHref(s.id)}
                    scroll={false}
                    aria-label={`Open ${s.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Identity shop name={s.name} sub={[s.owner, s.area].filter(Boolean).join(" · ")} />
                  </Link>
                </td>
                {show.sellThrough && (
                  <td>
                    {s.live ? (
                      <span className="x-mu">—</span>
                    ) : (
                      <>
                        <MiniBar percent={s.sellThrough} />
                        <span className="x-num">{s.sellThrough}%</span>
                      </>
                    )}
                  </td>
                )}
                <td className="r">
                  <div className="x-owes">{naira(s.owed)}</div>
                  {show.limit && (s.live?.creditLimit ?? 0) > 0 && (
                    <LimitUse owed={s.owed} limit={s.live?.creditLimit ?? 1} />
                  )}
                </td>
                {show.late && (
                  <td className={(s.live?.overdueDays ?? 0) > 30 ? "r x-num x-late is-hot" : "r x-num x-late"}>
                    {s.live?.overdueDays ? `${s.live.overdueDays} days` : <span className="x-mu">On time</span>}
                  </td>
                )}
                {show.score && (
                  <td className="x-num">
                    {s.live ? (
                      <span className="x-mu">—</span>
                    ) : (
                      <ScoreTicks score={s.score} />
                    )}
                  </td>
                )}
                {show.lastPayment && <td>{s.lastPayment}</td>}
                <td>
                  <Pill tone={shopStatus[s.status].tone}>{shopStatus[s.status].label}</Pill>
                </td>
                <td className="r">
                  <span className="x-open">Open</span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {/* how many rows and in what order: the sort is part of the answer */}
      {!loading && rows.length > 0 && (
        <p className="x-tfoot">
          <b>
            {rows.length === shops.length ? rows.length : `${rows.length} of ${shops.length}`} {shops.length === 1 ? "shop" : "shops"}
          </b>
          <span aria-hidden="true">·</span>
          {sort === "Highest owed first" ? "sorted by highest owed" : "sorted by lowest owed"}
        </p>
      )}
    </>
  );
}

/** How much of the shop's credit limit is used: a thin bar and the percent (orange at 95% and up). */
function LimitUse({ owed, limit }: { owed: number; limit: number }) {
  const pct = Math.round((owed / limit) * 100);
  return (
    <div className="x-use">
      <span className={pct >= 95 ? "x-use__bar is-hot" : "x-use__bar"}>
        <i style={{ "--w": `${Math.min(100, pct)}%` } as CSSProperties}></i>
      </span>
      {pct}% of limit
    </div>
  );
}
