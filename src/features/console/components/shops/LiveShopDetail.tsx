import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { ShopDrawer } from "@/features/console/components/shops/ShopDrawer";
import { Avatar } from "@/features/console/components/ui/Avatar";
import { Button, ButtonLink } from "@/features/console/components/ui/Button";
import { openLimitFor } from "@/features/console/components/credit/limit-entry";
import { limitOf, useLimits } from "@/features/console/lib/credit-limits";
import { Pill } from "@/features/console/components/ui/Pill";
import { consoleRoutes } from "@/features/console/config";
import type { Shop } from "@/features/console/content/shops";
import { naira, nairaShort } from "@/features/console/lib/format";

const TITLE_ID = "shop-title";

/**
 * A shop from the MIMI-AGENT API: only what the API knows (owed, overdue, limit, open invoices,
 * payments, disputes). No sell-through, score or best sellers, since the API has none of those.
 */
export function LiveShopDetail({ shop, live }: { shop: Shop; live: NonNullable<Shop["live"]> }) {
  /* a limit the owner set from the console wins over the book's figure */
  const limit = useLimits((s) => s.set[shop.id]?.limit) ?? limitOf(shop.id, live.creditLimit);
  return (
    <ShopDrawer
      titleId={TITLE_ID}
      head={
        <>
          <Avatar name={shop.name} size="lg" />
          <div>
            <h2 id={TITLE_ID}>{shop.name}</h2>
            <p>
              {shop.area} · {shop.owner}
            </p>
            <p className="x-in">
              {shop.whatsapp ? (
                <>
                  <span className="x-on"></span>WhatsApp {shop.whatsapp}
                </>
              ) : (
                <>
                  <span className="x-sd x-sd--off"></span>Not on WhatsApp
                </>
              )}
            </p>
          </div>
        </>
      }
    >
      <div className="x-dstats">
        <div>
          <b>{naira(shop.owed)}</b>
          <span>Owed</span>
        </div>
        <div>
          <b>{naira(live.overdue)}</b>
          <span>Overdue</span>
        </div>
        <div>
          <b>{nairaShort(limit)}</b>
          <span>Credit limit</span>
        </div>
      </div>
      <h3>Open invoices {live.openInvoices}</h3>
      {live.receivables ? (
        <ul className="x-dl">
          {live.receivables.map((r) => (
            <li key={r.id}>
              <span>
                <span className="x-num">{naira(r.outstanding)}</span> <span className="x-of">· due {r.due}</span>
              </span>
              {r.daysOverdue > 0 ? <Pill tone="red">{r.daysOverdue} days late</Pill> : <Pill tone="muted">Not due</Pill>}
            </li>
          ))}
        </ul>
      ) : (
        <SkeletonRows count={3} />
      )}
      <h3>Payments</h3>
      <ul className="x-dl">
        {shop.payments.map((p, i) => (
          <li key={`${p.date}-${p.amount}-${i}`}>
            <span>
              <span className="x-num">{naira(p.amount)}</span> <span className="x-of">· {p.date}</span>
            </span>
            {p.verified ? <Pill tone="green">Verified</Pill> : <Pill tone="muted">Self-reported</Pill>}
          </li>
        ))}
      </ul>
      {!!live.disputes?.length && (
        <>
          <h3>Open disputes</h3>
          <ul className="x-dl">
            {live.disputes.map((d) => (
              <li key={d}>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="x-dbtns">
        <Button onClick={() => openLimitFor(shop)}>Set limit</Button>
        <ButtonLink variant="primary" href={consoleRoutes.threads}>
          Open threads
        </ButtonLink>
      </div>
    </ShopDrawer>
  );
}
