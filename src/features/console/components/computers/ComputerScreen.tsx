import {
  chatBubbles,
  chatRows,
  sheetRows,
  statementRows,
  type ScreenKind,
} from "@/features/console/content/computers";
import { cx } from "@/lib/cx";

const BODY_CLASS: Record<ScreenKind, string> = {
  bank: "",
  chat: "x-tchat",
  sheet: "x-tsheet",
  idle: "x-tidle",
};
const SHEET_COLUMNS = ["", "A", "B", "C", "D"] as const;
const IDLE_LINES = 5;

/** The miniature screen in a computer card: bank statement, WhatsApp, a sheet, or blank. */
export function ComputerScreen({ kind }: { kind: ScreenKind }) {
  return (
    <div className={cx("x-tbody", BODY_CLASS[kind])}>
      {kind === "bank" && (
        <>
          <p>Statement · Wigmore Trading</p>
          {statementRows.map((r) => (
            <div key={r.time + r.who} className={cx("x-tbr", "hit" in r && "is-hit")}>
              <span>{r.time}</span>
              <span>{r.who}</span>
              <span>{r.amount}</span>
            </div>
          ))}
        </>
      )}
      {kind === "chat" && (
        <>
          <div>
            {chatRows.map((c) => (
              <div key={c.who} className={cx("x-tcr", "on" in c && "is-on")}>
                <i></i>
                <span>
                  <b>{c.who}</b>
                  <small>{c.text}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="x-tpane">
            {chatBubbles.map((b) => (
              <span key={b.text} className={cx("x-bub", "me" in b && "me")}>
                {b.text}
              </span>
            ))}
          </div>
        </>
      )}
      {kind === "sheet" && (
        <>
          {SHEET_COLUMNS.map((c) => (
            <span key={`h${c}`} className="h">
              {c}
            </span>
          ))}
          <span className="h">1</span>
          <span>Shop</span>
          <span>Cartons</span>
          <span>Value</span>
          <span>Day</span>
          {sheetRows.map((r, i) => [
            <span key={`${r.shop}-n`} className="h">
              {i + 2}
            </span>,
            <span key={`${r.shop}-s`}>{r.shop}</span>,
            <span key={`${r.shop}-c`} className={cx("n", "active" in r && "is-act")}>
              {r.cartons}
            </span>,
            <span key={`${r.shop}-v`} className="n">
              {r.value}
            </span>,
            <span key={`${r.shop}-d`}>{r.day}</span>,
          ])}
        </>
      )}
      {kind === "idle" && Array.from({ length: IDLE_LINES }, (_, i) => <i key={i}></i>)}
    </div>
  );
}
