import { statementRows } from "@/features/console/content/computers";
import { cx } from "@/lib/cx";

/** The Providus statement a computer is reading (thread panel, computer card, live window). */
export function StatementTable() {
  return (
    <div className="x-stmt">
      <p>Account statement · Wigmore Trading</p>
      <table>
        <tbody>
          {statementRows.map((r) => (
            <tr key={r.time + r.who} className={cx("hit" in r && "is-hit")}>
              <td>{r.time === "Yest." ? "Yesterday" : `Today ${r.time}`}</td>
              <td>{r.who.startsWith("POS") ? r.who : `Transfer · ${r.who}`}</td>
              <td>{r.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
