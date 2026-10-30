"use client";

import { LiveShopDetail } from "@/features/console/components/shops/LiveShopDetail";
import { ShopDrawer } from "@/features/console/components/shops/ShopDrawer";
import { Icon } from "@/features/console/components/ui/Icon";
import { StatusText, type Status } from "@/features/console/components/ui/StatusPill";
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
 * Shop record, round 2: leads with the one answer (what the shop owes and how it stands), then two
 * supporting figures, two equal actions, payments as two-line rows (date over proof, amount on the
 * right edge, no table header), the top three best sellers, and the details column.
 */
export function ShopDetail({ shop }: { shop: Shop }) {
  if (shop.live) return <LiveShopDetail shop={shop} live={shop.live} />;
  const scale = shop.salesThisWeek / BEST_SELLER_BASE_SALES;
  const sold = bestSellers
    .map((b) => ({ ...b, qty: Math.max(1, Math.round(b.qty * scale)) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);
  const st = shopStatus[shop.status];
  const paid = shop.payments.reduce((s, p) => s + p.amount, 0);
  const details: [string, string][] = [
    ["Route", `${shop.route} route`],
    ["WhatsApp", shop.whatsapp || "Not on WhatsApp, calls only"],
  ];

  return (
    <ShopDrawer
      titleId={TITLE_ID}
      wide
      head={
        <div className="v2-rec__head">
          <h2 id={TITLE_ID}>{shop.name}</h2>
          <p>
            {shop.area} · {shop.owner}
          </p>
        </div>
      }
    >
      <div className="v2-rec">
        <div className="v2-rec__main">
          <div className="v2-rec__lead">
            <p className="v2-rec__k">Owes</p>
            <p className="v2-rec__v v2-num">{naira(shop.owed)}</p>
            <p className="v2-rec__s">
              <StatusText status={STANDING[shop.status]}>{st.label}</StatusText> · last paid {shop.lastPayment}
            </p>
          </div>

          <dl className="v2-stats v2-stats--rec">
            <div>
              <dt>Sales this week</dt>
              <dd>{nairaShort(shop.salesThisWeek)}</dd>
            </div>
            <div>
              <dt>Sell-through</dt>
              <dd>{shop.sellThrough}%</dd>
            </div>
          </dl>

          <div className="v2-rec__acts">
            <ButtonLink href={threadHref("chase-over-50k")}>Open thread</ButtonLink>
            <LimitControl shop={shop.name} owed={shop.owed} />
          </div>

          <section className="v2-sec" aria-label="Payments">
            <header className="v2-sec__h">
              <h4>Payments</h4>
              <span className="v2-num">{naira(paid)}</span>
            </header>
            <ul className="v2-rows">
              {shop.payments.map((p) => (
                <li key={p.date + p.amount}>
                  <span className="v2-rows__l">
                    <span>{p.date}</span>
                    <StatusText status={p.verified ? "verified" : "self"}>
                      {p.verified ? "Bank verified" : "Self-reported"}
                    </StatusText>
                  </span>
                  <span className="v2-rows__r v2-num">{naira(p.amount)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="v2-sec" aria-label="Best sellers this week">
            <header className="v2-sec__h">
              <h4>Best sellers this week</h4>
            </header>
            <ul className="v2-rows v2-rows--one">
              {sold.map((b) => (
                <li key={b.name}>
                  <span className="v2-rows__l">
                    <span>{b.name}</span>
                  </span>
                  <span className="v2-rows__r v2-num">
                    {b.qty} {b.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="v2-rec__side" aria-label="Shop details">
          <header className="v2-sec__h">
            <h4>Details</h4>
          </header>
          <dl className="v2-kv">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div className="v2-kv__why">
              <dt>Credit score {shop.score}</dt>
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
