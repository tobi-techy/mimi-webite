import type { CSSProperties } from "react";
import type { Shop } from "@/features/console/content/shops";
import { naira } from "@/features/console/lib/format";

/**
 * Two charts over the shops board (Tobi, 5 Nov 2026: "the charts should be relevant to the board").
 * Both read the same shops the table lists: how late the money is, and which shops hold most of it.
 * Bars are pixel cells that fill in on load; orange only marks the oldest money.
 */
const CELLS = 24;

type Bucket = { label: string; shops: number; owed: number; hot?: boolean };

function ageBuckets(shops: readonly Shop[]): { title: string; buckets: Bucket[] } {
  const hasDays = shops.some((s) => s.live?.overdueDays != null);
  if (hasDays) {
    const defs: [string, (d: number) => boolean, boolean?][] = [
      ["On time", (d) => d <= 0],
      ["1 to 30 days late", (d) => d >= 1 && d <= 30],
      ["31 to 60 days late", (d) => d > 30 && d <= 60],
      ["Over 60 days late", (d) => d > 60, true],
    ];
    return {
      title: "Owed by how late",
      buckets: defs.map(([label, test, hot]) => {
        const inB = shops.filter((s) => test(s.live?.overdueDays ?? 0));
        return { label, shops: inB.length, owed: inB.reduce((a, s) => a + s.owed, 0), hot };
      }),
    };
  }
  const defs: [string, Shop["status"], boolean?][] = [
    ["Paying on time", "g"],
    ["One late payment", "w"],
    ["Past due date", "o", true],
  ];
  return {
    title: "Owed by how shops pay",
    buckets: defs.map(([label, st, hot]) => {
      const inB = shops.filter((s) => s.status === st);
      return { label, shops: inB.length, owed: inB.reduce((a, s) => a + s.owed, 0), hot };
    }),
  };
}

function Cells({ share, hot, delay }: { share: number; hot?: boolean; delay: number }) {
  const on = share > 0 ? Math.max(1, Math.round(share * CELLS)) : 0;
  return (
    <span className="x-cells" aria-hidden="true">
      {Array.from({ length: CELLS }, (_, i) => (
        <i
          key={i}
          className={i < on ? (hot ? "is-on is-hot" : "is-on") : undefined}
          style={i < on ? ({ "--d": `${delay + i * 18}ms` } as CSSProperties) : undefined}
        ></i>
      ))}
    </span>
  );
}

export function ShopsCharts({ shops }: { shops: readonly Shop[] }) {
  const total = shops.reduce((a, s) => a + s.owed, 0);
  if (!shops.length || total <= 0) return null;
  const { title, buckets } = ageBuckets(shops);
  const top = [...shops].sort((a, b) => b.owed - a.owed).slice(0, 5);
  const topSum = top.reduce((a, s) => a + s.owed, 0);
  const max = top[0]?.owed || 1;
  const pct = Math.round((topSum / total) * 100);

  return (
    <div className="x-shcharts">
      <section className="x-chcard" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <p>
            {naira(total)} across {shops.length} shops
          </p>
        </header>
        <ul className="x-agelist">
          {buckets.map((b, i) => (
            <li key={b.label} style={{ "--i": i } as CSSProperties}>
              <div className="x-agelist__row">
                <span>
                  {b.label}
                  <em> · {b.shops} {b.shops === 1 ? "shop" : "shops"}</em>
                </span>
                <b className={b.hot && b.owed > 0 ? "is-hot" : undefined}>{naira(b.owed)}</b>
              </div>
              <Cells share={b.owed / total} hot={b.hot} delay={i * 90} />
            </li>
          ))}
        </ul>
      </section>

      <section className="x-chcard" aria-label="Who holds the money">
        <header>
          <h2>Who holds the money</h2>
          <p>
            The top {top.length} shops hold {pct}% of what is owed
          </p>
        </header>
        <ul className="x-toplist">
          {top.map((s, i) => (
            <li key={s.id} style={{ "--i": i } as CSSProperties}>
              <span className="x-toplist__name">{s.name}</span>
              <span className="x-toplist__track">
                <i style={{ "--w": `${Math.max(3, (s.owed / max) * 100)}%`, "--d": `${120 + i * 70}ms` } as CSSProperties}></i>
              </span>
              <b>{naira(s.owed)}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
