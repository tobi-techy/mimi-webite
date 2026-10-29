import { BarChart } from "@/features/console/components/charts/BarChart";
import { LiveShopDetail } from "@/features/console/components/shops/LiveShopDetail";
import { ShopDrawer } from "@/features/console/components/shops/ShopDrawer";
import { Avatar } from "@/features/console/components/ui/Avatar";
import { Icon } from "@/features/console/components/ui/Icon";
import { Pill } from "@/features/console/components/ui/Pill";
import { LimitControl } from "@/features/console/components/shops/LimitControl";
import { threadHref } from "@/features/console/config";
import {
  BEST_SELLER_BASE_SALES,
  bestSellers,
  scoreReasons,
  type Shop,
} from "@/features/console/content/shops";
import { naira, nairaShort } from "@/features/console/lib/format";
import { ButtonLink } from "@/features/console/components/ui/Button";

const TITLE_ID = "shop-title";

/** One shop in the drawer: contact, this week's numbers, best sellers, payments and score. */
export function ShopDetail({ shop }: { shop: Shop }) {
  if (shop.live) return <LiveShopDetail shop={shop} live={shop.live} />;
  const scale = shop.salesThisWeek / BEST_SELLER_BASE_SALES;
  const sold = bestSellers.map((b) => ({ ...b, qty: Math.max(1, Math.round(b.qty * scale)) }));

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
                  <span className="x-on"></span>WhatsApp {shop.whatsapp} · replies in about 1h
                </>
              ) : (
                <>
                  <span className="x-sd x-sd--off"></span>Not on WhatsApp · calls only
                </>
              )}
            </p>
          </div>
        </>
      }
    >
      <div className="x-dstats">
        <div>
          <b>{nairaShort(shop.salesThisWeek)}</b>
          <span>
            Sales this week · <span className="x-vf">Verified</span>
          </span>
        </div>
        <div>
          <b>{shop.sellThrough}%</b>
          <span>Sell-through 7d</span>
        </div>
        <div>
          <b>{naira(shop.owed)}</b>
          <span>Owed</span>
        </div>
      </div>
      <h3>Best sellers</h3>
      <div className="x-ec x-ec--sm">
        <BarChart
          label={`Best sellers this week: ${sold.map((b) => `${b.name} ${b.qty} ${b.unit}`).join(", ")}`}
          bars={sold.map((b) => ({
            label: b.short,
            value: b.qty,
            caption: `${b.qty} ${b.unit}`,
            title: `${b.name}: ${b.qty} ${b.unit} sold this week`,
          }))}
        />
      </div>
      <h3>Payments</h3>
      <ul className="x-dl">
        {shop.payments.map((p) => (
          <li key={p.date + p.amount}>
            <span>
              <span className="x-num">{naira(p.amount)}</span> <span className="x-of">· {p.date}</span>
            </span>
            {p.verified ? <Pill tone="green">Verified</Pill> : <Pill tone="muted">Self-reported</Pill>}
          </li>
        ))}
      </ul>
      <h3>Credit score {shop.score}</h3>
      <ul className="x-dl">
        {scoreReasons(shop).map(([reason, good]) => (
          <li key={reason}>
            <Icon name={good ? "circle-check" : "circle-dot"} className={good ? "i x-up" : "i x-dn"} />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      <div className="x-dbtns">
        <ButtonLink variant="primary" href={threadHref("chase-over-50k")}>
          Open thread
        </ButtonLink>
        <LimitControl shop={shop.name} owed={shop.owed} />
      </div>
    </ShopDrawer>
  );
}

