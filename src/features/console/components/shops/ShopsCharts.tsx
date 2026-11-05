"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { Shop } from "@/features/console/content/shops";
import { naira } from "@/features/console/lib/format";

/**
 * Two charts over the shops board (Tobi, 5 Nov 2026: charts relevant to the board, easy to read,
 * clean with clean motion). Both read the same shops the table lists. Solid bars, each row's share
 * of what is owed, orange only for the oldest money.
 */
type Bucket = { label: string; shops: number; owed: number; tone: "a" | "b" | "c" | "hot" };

function ageBuckets(shops: readonly Shop[]): { title: string; buckets: Bucket[] } {
  if (shops.some((s) => s.live?.overdueDays != null)) {
    const defs: [string, (d: number) => boolean, Bucket["tone"]][] = [
      ["Up to 14 days late", (d) => d <= 14, "a"],
      ["15 to 30 days late", (d) => d >= 15 && d <= 30, "b"],
      ["31 to 45 days late", (d) => d > 30 && d <= 45, "c"],
      ["Over 45 days late", (d) => d > 45, "hot"],
    ];
    return {
      title: "Owed by how late",
      buckets: defs.map(([label, test, tone]) => {
        const inB = shops.filter((s) => s.owed > 0 && test(s.live?.overdueDays ?? 0));
        return { label, tone, shops: inB.length, owed: inB.reduce((a, s) => a + s.owed, 0) };
      }),
    };
  }
  const defs: [string, Shop["status"], Bucket["tone"]][] = [
    ["Paying on time", "g", "a"],
    ["One late payment", "w", "c"],
    ["Past due date", "o", "hot"],
  ];
  return {
    title: "Owed by how shops pay",
    buckets: defs.map(([label, st, tone]) => {
      const inB = shops.filter((s) => s.status === st);
      return { label, tone, shops: inB.length, owed: inB.reduce((a, s) => a + s.owed, 0) };
    }),
  };
}

/** Counts a number up once on mount; jumps straight to it when reduced motion is on. */
function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const share = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export function ShopsCharts({ shops }: { shops: readonly Shop[] }) {
  const total = shops.reduce((a, s) => a + s.owed, 0);
  const shown = useCountUp(total);
  if (!shops.length || total <= 0) return null;
  const { title, buckets } = ageBuckets(shops);
  const top = [...shops].sort((a, b) => b.owed - a.owed).slice(0, 5);
  const max = top[0]?.owed || 1;
  const topPct = share(top.reduce((a, s) => a + s.owed, 0), total);

  return (
    <div className="x-shcharts">
      <section className="x-chcard" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <p className="x-chcard__big">{naira(shown)}</p>
          <p>owed by {shops.length} shops</p>
        </header>
        <div className="x-stack" role="img" aria-label={buckets.map((b) => `${b.label} ${share(b.owed, total)}%`).join(", ")}>
          {buckets
            .filter((b) => b.owed > 0)
            .map((b, i) => (
              <i
                key={b.label}
                className={`t-${b.tone}`}
                style={{ "--w": `${(b.owed / total) * 100}%`, "--d": `${200 + i * 120}ms` } as CSSProperties}
              ></i>
            ))}
        </div>
        <ul className="x-agekey">
          {buckets.map((b, i) => (
            <li key={b.label} style={{ "--i": i } as CSSProperties}>
              <span className={`x-dot t-${b.tone}`}></span>
              <span className="x-agekey__label">
                {b.label}
                <em> · {b.shops} {b.shops === 1 ? "shop" : "shops"}</em>
              </span>
              <b className={b.tone === "hot" && b.owed > 0 ? "is-hot" : undefined}>{naira(b.owed)}</b>
              <span className="x-pct">{share(b.owed, total)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="x-chcard" aria-label="Shops that owe the most">
        <header>
          <h2>Shops that owe the most</h2>
          <p className="x-chcard__big">{topPct}%</p>
          <p>of all money owed sits with these {top.length} shops</p>
        </header>
        <ul className="x-toplist">
          {top.map((s, i) => (
            <li key={s.id} style={{ "--i": i } as CSSProperties}>
              <div className="x-toplist__row">
                <span className="x-toplist__name">{s.name}</span>
                <b>{naira(s.owed)}</b>
                <span className="x-pct">{share(s.owed, total)}%</span>
              </div>
              <span className="x-toplist__track">
                <i style={{ "--w": `${Math.max(2, (s.owed / max) * 100)}%`, "--d": `${200 + i * 80}ms` } as CSSProperties}></i>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
