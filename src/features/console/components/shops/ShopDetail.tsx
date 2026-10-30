"use client";

import { LiveShopDetail } from "@/features/console/components/shops/LiveShopDetail";
import { ShopDrawer } from "@/features/console/components/shops/ShopDrawer";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { StatusPill, type Status } from "@/features/console/components/ui/StatusPill";
import { LimitControl } from "@/features/console/components/shops/LimitControl";
import { threadHref } from "@/features/console/config";
import {
  BEST_SELLER_BASE_SALES,
  bestSellers,
  scoreReasons,
  shopStatus,
  type Shop,
  type ShopStatus,
} from "@/features/console/content/shops";
import { naira, nairaShort } from "@/features/console/lib/format";
import { ButtonLink } from "@/features/console/components/ui/Button";

const TITLE_ID = "shop-title";
const STANDING: Record<ShopStatus, Status> = { g: "paid", w: "partial", o: "overdue" };

/**
 * v2 shop record (Leye's record page): big plain title with one quiet meta line, a row of
 * label-over-value stats, small neutral actions on the right, the payments table with hairline
 * rows, best sellers as a ranked list, and a details panel. (No Activity tab: it would only repeat the payments table.)
 */
export function ShopDetail({ shop }: { shop: Shop }) {
  if (shop.live) return <LiveShopDetail shop={shop} live={shop.live} />;
  const scale = shop.salesThisWeek / BEST_SELLER_BASE_SALES;
  const sold = bestSellers.map((b) => ({ ...b, qty: Math.max(1, Math.round(b.qty * scale)) }));
  const st = shopStatus[shop.status];
  const details: [string, IconName, string][] = [
    ["Route", "truck", `${shop.route} · ${shop.area}`],
    ["Owner", "users", shop.owner],
    ["WhatsApp", "whatsapp", shop.whatsapp || "Not on WhatsApp, calls only"],
    ["Pays in", "clock", `${shop.avgDaysToPay} days on average`],
    ["Last payment", "calendar", shop.lastPayment],
  ];

  return (
    <ShopDrawer
      titleId={TITLE_ID}
      wide
      head={
        <div className="v2-rec__head">
          <h2 id={TITLE_ID}>{shop.name}</h2>
          <StatusPill status={STANDING[shop.status]}>{st.label}</StatusPill>
          <p>
            {shop.area} · {shop.owner}
            {shop.whatsapp ? ` · ${shop.whatsapp}` : " · calls only"}
          </p>
        </div>
      }
    >
      <div className="v2-rec">
        <div className="v2-rec__main">
          <div className="v2-rec__bar">
            <dl className="v2-stats v2-stats--rec">
              <div>
                <dt>Owed</dt>
                <dd>{naira(shop.owed)}</dd>
              </div>
              <div>
                <dt>Sales this week</dt>
                <dd>{nairaShort(shop.salesThisWeek)}</dd>
              </div>
              <div>
                <dt>Sell-through</dt>
                <dd>{shop.sellThrough}%</dd>
              </div>
              <div>
                <dt>Credit score</dt>
                <dd>{shop.score}</dd>
              </div>
            </dl>
            <div className="v2-rec__acts">
              <ButtonLink href={threadHref("chase-over-50k")}>Open thread</ButtonLink>
              <LimitControl shop={shop.name} owed={shop.owed} />
            </div>
          </div>

          <section className="v2-card v2-card--flat" aria-label="Payments">
            <header className="v2-card__h">
              <div>
                <h4>Payments</h4>
                <p>
                  {shop.payments.length} payments · {naira(shop.payments.reduce((s, p) => s + p.amount, 0))}{" "}
                  in all
                </p>
              </div>
            </header>
            <div className="v2-tc__table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Proof</th>
                    <th scope="col" className="is-r">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shop.payments.map((p) => (
                    <tr key={p.date + p.amount}>
                      <td>{p.date}</td>
                      <td>
                        {p.verified ? (
                          <StatusPill status="verified">Bank verified</StatusPill>
                        ) : (
                          <StatusPill status="self" />
                        )}
                      </td>
                      <td className="is-r v2-num">{naira(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* best sellers as a ranked list: four products read faster as rows than as bars */}
          <section className="v2-card v2-card--flat" aria-label="Best sellers this week">
            <header className="v2-card__h">
              <div>
                <h4>Best sellers this week</h4>
                <p>What to keep on the next delivery</p>
              </div>
            </header>
            <ol className="v2-rank">
              {sold.map((b) => (
                <li key={b.name}>
                  <span>{b.name}</span>
                  <span className="v2-num">
                    {b.qty} <small>{b.unit}</small>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="v2-rec__side" aria-label="Shop details">
          <h4 className="v2-side__h">Details</h4>
          <dl className="v2-kv">
            {details.map(([k, icon, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <Icon name={icon} />
                  {v}
                </dd>
              </div>
            ))}
            <div className="v2-kv__why">
              <dt>Score {shop.score}</dt>
              <dd>
                <ul>
                  {scoreReasons(shop).map(([reason, good]) => (
                    <li key={reason} className={good ? undefined : "is-warn"}>
                      <Icon name={good ? "circle-check" : "circle-dot"} />
                      {reason}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </ShopDrawer>
  );
}
