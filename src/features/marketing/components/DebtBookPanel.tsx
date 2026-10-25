import { Chip, Stat } from "@/components/ui/Tag";
import type { debtBookExample } from "@/features/marketing/content/shops";

/** Shop debt book example: rows fill in, payments strike through, the total counts down. */
export function DebtBookPanel({ data }: { data: typeof debtBookExample }) {
  return (
    <div className="x-book x-panel" data-story="book" aria-label="Illustrative example of a shop debt book">
      <div className="x-panel__head">
        <span className="x-label">Debt book · Illustrative example</span>
        <Stat>{data.customers}</Stat>
      </div>
      <ol className="x-book__rows">
        {data.rows.map((r) => (
          <li key={r.name} className="x-srow x-a" data-t={r.t}>
            <span>
              {r.name}
              <small>{r.item}</small>
            </span>
            {r.paidAt === undefined ? (
              <>
                <Stat className="x-book__amt">{r.amount}</Stat>
                <span className="x-sw">
                  <Chip>Owes</Chip>
                </span>
              </>
            ) : (
              <>
                <span className="x-num x-book__amt x-book__amt--paid x-a" data-t={r.paidAt}>
                  {r.amount}
                </span>
                <span className="x-sw x-a" data-t={r.paidAt}>
                  <Chip className="x-sw__a" hidden>
                    Owes
                  </Chip>
                  <Chip tone="ok" className="x-sw__b">
                    Paid
                  </Chip>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
      <div className="x-book__total">
        <span className="x-label">Still owed</span>
        <output data-from={data.total.from} data-count={data.total.steps}>
          {data.total.final}
        </output>
      </div>
    </div>
  );
}
