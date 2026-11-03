"use client";

import { proofStatus, proofWords } from "@/features/console/lib/proof";
import { LiveShopDetail } from "@/features/console/components/shops/LiveShopDetail";
import { ShopDrawer } from "@/features/console/components/shops/ShopDrawer";
import { Icon } from "@/features/console/components/ui/Icon";
import { StatusText, type Status } from "@/features/console/components/ui/StatusPill";
import { Button } from "@/features/console/components/ui/Button";
import { limitTarget, openLimitFor } from "@/features/console/components/credit/limit-entry";
import { useLimits } from "@/features/console/lib/credit-limits";
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
import { BankLogo } from "@/features/console/components/ui/BankLogo";

const TITLE_ID = "shop-title";
const STANDING: Record<ShopStatus, Status> = { g: "paid", w: "partial", o: "overdue" };

/**
 * Shop record, round 2: leads with the one answer (what the shop owes and how it stands), then two
 * supporting figures, two equal actions, payments as two-line rows (date over proof, amount on the
 * right edge, no table header), the top three best sellers, and the details column. Round 3: each
 * payment leads with the bank's logo tile and name (where it landed, or where the shop says it sent from).
 */
/** "Credit limit ₦300,000": opens Set credit limit for this shop. */
function LimitButton({ shop }: { shop: Shop }) {
  const set = useLimits((s) => s.set[shop.id]?.limit);
  const now = set ?? limitTarget(shop).current;
  return <Button onClick={() => openLimitFor(shop)}>Credit limit {naira(now)}</Button>;
}

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
            <LimitButton shop={shop} />
          </div>

          <section className="v2-sec" aria-label="Payments">
            <header className="v2-sec__h">
              <h4>Payments</h4>
              <span className="v2-num">{naira(paid)}</span>
            </header>
            <ul className="v2-rows">
              {shop.payments.map((p) => {
                const grade = p.proof ?? (p.verified ? "verified" : "unverified");
                const proof = <StatusText status={proofStatus[grade]}>{proofWords[grade]}</StatusText>;
                return (
                  <li key={p.date + p.amount} className={p.via ? "v2-rows--bank" : undefined}>
                    {p.via && <BankLogo bank={p.via} size={24} />}
                    <span className="v2-rows__l">
                      {p.via ? (
                        <>
                          <span>{p.via}</span>
                          <span className="v2-rows__sub">
                            {p.date} · {proof}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{p.date}</span>
                          {proof}
                        </>
                      )}
                    </span>
                    <span className="v2-rows__r v2-num">{naira(p.amount)}</span>
                  </li>
                );
              })}
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
