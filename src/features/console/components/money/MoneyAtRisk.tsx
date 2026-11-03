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
import { naira, nairaShort } from "@/features/console/lib/format";

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
  return exposure ? <FromApi e={exposure} /> : <FromBook shops={shops} totals={totals} />;
}

function Kpis({ values, labels = TILES }: { values: Array<string | null>; labels?: readonly string[] }) {
  return (
    <div className="x-kpis">
      {values.map((value, i) => (
        <div key={labels[i]} className="x-kpi">
          <b>{value ?? <SkeletonNum />}</b>
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** The API's exposure endpoint: its buckets, its ageing, its weighted figure, labelled as such. */
function FromApi({ e }: { e: Exposure }) {
  const { total } = e;
  const readable = e.bands.some((b) => total.band[b.key] !== null);
  /* one set of shops behind the tile, the section heading and the rows: they can never disagree */
  const rows = e.shops
    .filter((s) => s.owed > 0 || s.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || b.owed - a.owed);

  return (
    <>
      <Kpis
        values={[
          naira(total.owed),
          naira(total.overdue),
          String(rows.length),
          total.oldest > 0 ? `${total.oldest} ${total.oldest === 1 ? "day" : "days"}` : "None",
        ]}
      />

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="clock" />
          <h2>How old the money is</h2>
          <span className="x-num">{nairaShort(total.overdue)}</span>
        </div>
        <ul className="v2-rows">
          {e.bands.map((b) => {
            const money = total.band[b.key] ?? null;
            return (
              <li key={b.key}>
                <span className="v2-rows__l">
                  <span>{b.label}</span>
                  <span className="v2-rows__sub">
                    {b.fromDays} to {b.toDays} days · weighted at {b.weightPct}%
                  </span>
                </span>
                <span className="v2-rows__r">
                  {money !== null && total.overdue > 0 && <MiniBar percent={(money / total.overdue) * 100} />}
                  {money !== null ? <span className="x-num">{naira(money)}</span> : <span className="x-mu">No figure</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="x-sub">
          Risk weighted {naira(total.weighted)} at the weights above. That is an assumption about age,
          not money anyone owes, so the outstanding figure is the one to go by.
        </p>
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
          <Table label="Money at risk">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                <th scope="col" className="r">
                  Outstanding
                </th>
                <th scope="col" className="r">
                  Past due
                </th>
                <th scope="col" className="r">
                  Oldest
                </th>
                <th scope="col">Why it sits there</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="is-link">
                  <td>
                    <Link href={shopHref(s.id)} scroll={false} aria-label={`Open ${s.name}`}>
                      <Identity name={s.name} sub={s.note || s.confidence || ""} />
                    </Link>
                  </td>
                  <td className="r x-ink">{naira(s.owed)}</td>
                  <td className="r x-ink">{naira(s.overdue)}</td>
                  <td className="r x-num">{s.oldest > 0 ? `${s.oldest} d` : "Today"}</td>
                  <td className="x-mu">
                    {s.openInvoices} open {s.openInvoices === 1 ? "invoice" : "invoices"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <p className="x-sub">
        {naira(total.verified)} confirmed by the bank · {naira(total.shownNotCounted)} shown but not
        counted yet. From Coral Lane&apos;s book{readable ? "" : ", and this server sends no money per band"}.
      </p>
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
      <Kpis
        values={[
          naira(age.owed),
          naira(age.overdue),
          String(age.debtors),
          age.oldest > 0 ? `${age.oldest} ${age.oldest === 1 ? "day" : "days"}` : "None",
        ]}
      />

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="clock" />
          <h2>How old the money is</h2>
          <span className="x-num">{nairaShort(age.overdue)}</span>
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
          <Table label="Money at risk">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                <th scope="col" className="r">
                  Outstanding
                </th>
                <th scope="col" className="r">
                  Past due
                </th>
                <th scope="col" className="r">
                  Oldest
                </th>
                <th scope="col">Why it sits there</th>
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
                    <td className="r x-ink">{naira(s.live?.overdue ?? 0)}</td>
                    <td className="r x-num">{days > 0 ? `${days} d` : "Today"}</td>
                    <td className="x-mu">{reasonOf(s)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      <p className="x-sub">
        From Coral Lane&apos;s book. The age is each shop&apos;s oldest unpaid invoice, so a shop sits
        in the band its oldest money falls in.
      </p>
    </>
  );
}
