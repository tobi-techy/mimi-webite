import { Stat } from "@/components/ui/Tag";
import type { brandViewExample } from "@/features/marketing/content/brands";
import { cx } from "@/lib/cx";

/** Brand view example: shop rows fold into area totals (played by the TriggeredStory motion). */
export function BrandViewPanel({ data }: { data: typeof brandViewExample }) {
  return (
    <div
      className="x-agg x-panel"
      data-story="agg"
      aria-label="Illustrative example of the brand view: area totals, not shop rows"
    >
      <div className="x-panel__head">
        <span className="x-label">Brand view · Illustrative example</span>
        <Stat>{data.product}</Stat>
      </div>
      <div className="x-agg__stage">
        <ul className="x-agg__shops" aria-hidden="true">
          {data.shops.map((s) => (
            <li key={s.name} className="x-srow x-agg__shop x-a" data-t={s.t} style={{ "--to": s.to }}>
              <span>
                {s.name}
                <small>{s.area}</small>
              </span>
              <Stat>{s.qty}</Stat>
            </li>
          ))}
        </ul>
        <ul className="x-agg__tot">
          {data.totals.map((t) => (
            <li key={t.name} className={cx("x-srow", t.all && "x-agg__all", "x-a")} data-t={t.t}>
              <span>
                {t.name}
                <small>{t.note}</small>
              </span>
              <Stat>{t.qty}</Stat>
            </li>
          ))}
          <li className="x-agg__note x-a" data-t={data.note.t}>
            {data.note.text}
          </li>
        </ul>
      </div>
    </div>
  );
}
