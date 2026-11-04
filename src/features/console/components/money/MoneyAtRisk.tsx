"use client";

import Link from "next/link";
import { Identity } from "@/features/console/components/ui/Avatar";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { MiniBar } from "@/features/console/components/ui/Meter";
import { Table } from "@/features/console/components/ui/Table";
import { SkeletonNum, SkeletonRows } from "@/features/console/components/live/Skeleton";
import { BookUnreachable } from "@/features/console/components/live/BookUnreachable";
import { shopHref } from "@/features/console/config";
import { useBookTotals, useExposure, useShops, useUnreachable } from "@/features/console/api/hooks";
import type { Exposure } from "@/features/console/content/exposure";
import type { Shop } from "@/features/console/content/shops";
import { ageingOf, reasonOf } from "@/features/console/lib/ageing";
import { naira } from "@/features/console/lib/format";

const TILES = ["Total at risk", "Past due", "Shops carrying it", "Oldest"] as const;

/**
 * Money at risk: one morning screen for visibility and credit exposure. Everything the book is
 * owed, the part past its due date, how old that money is, and why each shop sits where it does.
 *
 * Two sources, one screen. When the API has GET /v1/credit/exposure the screen renders it and
 * nothing else: the API owns the buckets, the ageing and the weighted figure. Until then the
 * console reads GET /v1/shops (see lib/ageing.ts, which goes away with the endpoint).
 */
export function MoneyAtRisk() {
  const { shops, loading } = useShops();
  const totals = useBookTotals();
  const exposure = useExposure();
  const unreachable = useUnreachable();

  /* an unread book shows no figures: noughts here would read as "nobody owes you anything" */
  if (unreachable) return <BookUnreachable empty="No shop owes anything right now" />;
  if (loading) {
    return (
      <>
        <Kpis values={TILES.map(() => null)} />
        <SkeletonRows count={6} />
      </>
    );
  }
  return exposure ? <FromApi e={exposure} shopCount={shops.length} /> : <FromBook shops={shops} totals={totals} />;
}

/** The four tiles. A note gives a figure its context (share of the total, out of how many shops); it is only shown when it can be read off figures already on screen. */
function Kpis({
  values,
  notes = [],
  labels = TILES,
}: {
  values: Array<string | null>;
  notes?: Array<string | null>;
  labels?: readonly string[];
}) {
  return (
    <div className="x-kpis">
      {values.map((value, i) => (
        <div key={labels[i]} className="x-kpi">
          <b>{value ?? <SkeletonNum />}</b>
          <span>{labels[i]}</span>
          {notes[i] ? <small>{notes[i]}</small> : null}
        </div>
      ))}
    </div>
  );
}

/** "58% of the total", or null when there is no total to take a share of. */
const shareOf = (part: number, whole: number) => (whole > 0 && part > 0 ? `${Math.round((part / whole) * 100)}% of the total` : null);
/** "₦5,329,350 not yet due": the part of the total that is not late, or null when none of it is. */
const notDue = (owed: number, overdue: number) => (owed - overdue > 0 ? `${naira(owed - overdue)} not yet due` : null);
/** The shop behind the oldest figure ("at Funke & Sons Mini Mart"), or null when nothing is late. */
function oldestAt<T extends { name: string }>(s: T | undefined, days: (s: T) => number): string | null {
  return s && days(s) > 0 ? `at ${s.name}` : null;
}
/** "of 40 shops", or null before the shop list is read. */
const ofShops = (n: number) => (n > 0 ? `of ${n} ${n === 1 ? "shop" : "shops"}` : null);

/**
 * The page's point in one line, facts in ink and connecting words in grey: how much is past due,
 * across how many shops, and how much of it the five biggest carry. Every figure is the API's own
 * or a share of figures already on this screen; nothing is invented.
 */
function Headline({ overdue, owed, pastDue }: { overdue: number; owed: number; pastDue: readonly number[] }) {
  const n = pastDue.length;
  if (overdue <= 0 || n === 0) {
    return (
      <p className="x-sub">
        Nothing is past due. <b>{naira(owed)}</b> is owed, none of it late.
      </p>
    );
  }
  const top = [...pastDue].sort((a, b) => b - a).slice(0, 5);
  const share = Math.round((top.reduce((t, v) => t + v, 0) / overdue) * 100);
  return (
    <p className="x-sub">
      <b>{naira(overdue)}</b> is past due across <b>{n} {n === 1 ? "shop" : "shops"}</b>.
      {n > 5 ? (
        <>
          {" "}
          The top <b>5</b> carry <b>{share}%</b> of it.
        </>
      ) : null}
    </p>
  );
}

/** The quiet line under a table: how many rows and how they are sorted, because the sort is part of the answer. */
const SortedBy = ({ n }: { n: number }) => (
  <p className="x-tfoot">
    {n} {n === 1 ? "shop" : "shops"} · sorted by past due, largest first
  </p>
);

/** The API's exposure endpoint: its buckets, its ageing, its weighted figure, labelled as such. */
function FromApi({ e, shopCount }: { e: Exposure; shopCount: number }) {
  const { total } = e;
  /* one set of shops behind the tile, the section heading and the rows: they can never disagree */
  const rows = e.shops
    .filter((s) => s.owed > 0 || s.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || b.owed - a.owed);

  return (
    <>
      <Headline overdue={total.overdue} owed={total.owed} pastDue={rows.filter((s) => s.overdue > 0).map((s) => s.overdue)} />
      <Kpis
        values={[
          naira(total.owed),
          naira(total.overdue),
          String(rows.length),
          total.oldest > 0 ? `${total.oldest} ${total.oldest === 1 ? "day" : "days"}` : "None",
        ]}
        notes={[
          notDue(total.owed, total.overdue),
          shareOf(total.overdue, total.owed),
          ofShops(shopCount),
          oldestAt([...rows].sort((a, b) => b.oldest - a.oldest)[0], (s) => s.oldest),
        ]}
      />

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="clock" />
          <h2>How old the money is</h2>
        </div>
        <ul className="v2-rows">
          {e.bands.map((b) => {
            const money = total.band[b.key] ?? null;
            return (
              <li key={b.key}>
                <span className="v2-rows__l">
                  <span>{b.label}</span>
                </span>
                <span className="v2-rows__r">
                  {money !== null && total.overdue > 0 && <MiniBar percent={(money / total.overdue) * 100} />}
                  {money !== null ? <span className="x-num">{naira(money)}</span> : <span className="x-mu">No figure</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="store" />
          <h2>Shops carrying it</h2>
          <span className="x-num">{rows.length}</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState>No shop owes anything right now</EmptyState>
        ) : (
          <Table label="Money at risk" className="x-dt--phone-fit">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                <th scope="col" className="r">
                  Outstanding
                </th>
                {/* phones keep shop and amount only, so the table never scrolls sideways */}
                <th scope="col" className="r mc-hide-phone">
                  Past due
                </th>
                <th scope="col" className="r mc-hide-phone">
                  Oldest
                </th>
                <th scope="col" className="mc-hide-phone">Why it sits there</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="is-link">
                  <td>
                    <Link href={shopHref(s.id)} scroll={false} aria-label={`Open ${s.name}`}>
                      <Identity name={s.name} />
                    </Link>
                  </td>
                  <td className="r x-ink">{naira(s.owed)}</td>
                  <td className="r x-ink mc-hide-phone">{naira(s.overdue)}</td>
                  <td className="r x-num mc-hide-phone">{s.oldest > 0 ? `${s.oldest} d` : "Today"}</td>
                  <td className="x-mu mc-hide-phone">
                    {s.openInvoices} open {s.openInvoices === 1 ? "invoice" : "invoices"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {rows.length > 0 && <SortedBy n={rows.length} />}
      </div>

    </>
  );
}

/** Until the exposure endpoint lands: the same screen, summed and bucketed from GET /v1/shops. */
function FromBook({ shops, totals }: { shops: readonly Shop[]; totals: { owed: number; overdue: number } | null }) {
  const age = ageingOf(shops, totals);
  const debtors = shops
    .filter((s) => (s.live?.overdue ?? 0) > 0)
    .sort((a, b) => (b.live?.overdue ?? 0) - (a.live?.overdue ?? 0) || a.name.localeCompare(b.name));

  return (
    <>
      <Headline overdue={age.overdue} owed={age.owed} pastDue={debtors.map((s) => s.live?.overdue ?? 0)} />
      <Kpis
        values={[
          naira(age.owed),
          naira(age.overdue),
          String(age.debtors),
          age.oldest > 0
            ? `${age.oldest} ${age.oldest === 1 ? "day" : "days"}`
            : age.undated > 0
              ? "Not given"
              : "None",
        ]}
        notes={[
          notDue(age.owed, age.overdue),
          shareOf(age.overdue, age.owed),
          ofShops(shops.length),
          oldestAt(
            [...debtors].sort((a, b) => (b.live?.overdueDays ?? 0) - (a.live?.overdueDays ?? 0))[0],
            (s) => s.live?.overdueDays ?? 0,
          ),
        ]}
      />

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="clock" />
          <h2>How old the money is</h2>
        </div>
        {age.overdue > 0 ? (
          <ul className="v2-rows">
            {age.bands.map((b) => (
              <li key={b.id}>
                <span className="v2-rows__l">
                  <span>{b.label}</span>
                  <span className="v2-rows__sub">
                    {b.shops} {b.shops === 1 ? "shop" : "shops"}
                  </span>
                </span>
                <span className="v2-rows__r">
                  <MiniBar percent={age.overdue > 0 ? (b.money / age.overdue) * 100 : 0} />
                  <span className="x-num">{naira(b.money)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Nothing is past its due date right now</EmptyState>
        )}
        {age.undated > 0 && (
          <p className="x-sub">
            {naira(age.undated)} past due has no day count, so it is in no band.
          </p>
        )}
      </div>

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="store" />
          <h2>Shops carrying it</h2>
          <span className="x-num">{age.debtors}</span>
        </div>
        {debtors.length === 0 ? (
          <EmptyState>No shop is past its due date right now</EmptyState>
        ) : (
          <Table label="Money at risk" className="x-dt--phone-fit">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                <th scope="col" className="r">
                  Outstanding
                </th>
                {/* phones keep shop and amount only, so the table never scrolls sideways */}
                <th scope="col" className="r mc-hide-phone">
                  Past due
                </th>
                <th scope="col" className="r mc-hide-phone">
                  Oldest
                </th>
                <th scope="col" className="mc-hide-phone">Why it sits there</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map((s) => {
                const days = Math.max(0, s.live?.overdueDays ?? 0);
                return (
                  <tr key={s.id} className="is-link">
                    <td>
                      <Link href={shopHref(s.id)} scroll={false} aria-label={`Open ${s.name}`}>
                        <Identity name={s.name} sub={s.area} />
                      </Link>
                    </td>
                    <td className="r x-ink">{naira(s.owed)}</td>
                    <td className="r x-ink mc-hide-phone">{naira(s.live?.overdue ?? 0)}</td>
                    <td className="r x-num mc-hide-phone">{days > 0 ? `${days} d` : "Today"}</td>
                    <td className="x-mu mc-hide-phone">{reasonOf(s)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {debtors.length > 0 && <SortedBy n={debtors.length} />}
      </div>

    </>
  );
}
