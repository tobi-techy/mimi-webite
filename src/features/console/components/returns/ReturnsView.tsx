"use client";

import { Fragment, useState } from "react";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { Pill } from "@/features/console/components/ui/Pill";
import { Table } from "@/features/console/components/ui/Table";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { refresh } from "@/features/console/api/sync";
import { useReturns } from "@/features/console/api/hooks";
import { Button } from "@/features/console/components/ui/Button";
import { Note } from "@/features/console/components/ui/Note";
import { cameBack, conditionWords, dayOf, dispositionWords, isOpenReturn, personOf, returnedPct, statusView, type ShopReturn } from "@/features/console/content/returns";
import { naira } from "@/features/console/lib/format";

const tone = { neutral: "muted", sand: "amber", green: "green" } as const;

/** The status word, in the API's own vocabulary, in the console's pill. */
function StatusPill({ status }: { status: string }) {
  const v = statusView(status);
  return (
    <Pill tone={tone[v.tone]}>
      <Icon name={v.icon} />
      {v.label}
    </Pill>
  );
}

/**
 * Returns: open returns with where each one is, its lines and reason, what came back and where it
 * went. The end of the flow is a credit the owner approves with an undo, offered as a normal
 * approval card, so it never needs a second kind of decision here.
 *
 * Until this server has GET /v1/returns the screen says so in plain words. It never shows an empty
 * list, which would read as "no returns" and would not be true, and a read that failed says that
 * instead of borrowing the not-connected wording, with the same Try again the book pages offer.
 */
export function ReturnsView() {
  const { returns, loading, missing, failed } = useReturns();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(open === id ? null : id);

  if (loading) return <SkeletonRows count={6} />;
  if (missing) return <NotYet />;
  if (failed)
    return (
      <>
        <EmptyState>Mimi couldn&apos;t read the returns ledger just now.</EmptyState>
        <Note>
          <Button size="sm" variant="ghost" onClick={() => void refresh(true)}>
            Try again
          </Button>
        </Note>
      </>
    );
  if (returns.length === 0) return <EmptyState>No returns yet</EmptyState>;

  const rows = [...returns].sort(
    (a, b) => Number(isOpenReturn(b)) - Number(isOpenReturn(a)) || b.updatedAt.localeCompare(a.updatedAt),
  );
  const openCount = returns.filter(isOpenReturn).length;

  return (
    <>
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="package" />
          <h2>Open returns</h2>
          <span className="x-num">
            {openCount} of {returns.length}
          </span>
        </div>
        <Table label="Returns">
          <thead>
            <tr>
              <th scope="col">Shop</th>
              <th scope="col">Why it came back</th>
              <th scope="col" className="r">
                Drafted
              </th>
              <th scope="col" className="r">
                Came back
              </th>
              <th scope="col">Where it is</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr
                  className="is-link"
                  /* there is no per-return page to link to, so the row is the control: give it a
                     tab stop and the two keys a button answers, or a keyboard user cannot open one */
                  tabIndex={0}
                  onClick={() => toggle(r.id)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    toggle(r.id);
                  }}
                  aria-expanded={open === r.id}
                >
                  <td className="x-ink">{r.shop}</td>
                  <td className="x-mu">{r.reason}</td>
                  <td className="r x-num">{naira(r.drafted)}</td>
                  <td className="r x-num">{naira(r.returned)}</td>
                  <td>
                    <StatusPill status={r.status} />
                  </td>
                </tr>
                {open === r.id && (
                  <tr>
                    <td colSpan={5}>
                      <ReturnDetail r={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </div>
      <p className="x-sub">
        Every return moves through the same steps: drafted, agreed, collected, checked, credited.
        Nothing moves until you agree to the pickup, and the credit at the end can be undone.
      </p>
    </>
  );
}

/** One return in full: its lines, then its steps, then the credit that closes it. */
function ReturnDetail({ r }: { r: ShopReturn }) {
  const v = statusView(r.status);
  return (
    <div className="v2-rec">
      <section className="v2-sec" aria-label="Lines">
        <header className="v2-sec__h">
          <h4>What came back</h4>
          <span className="v2-num">{cameBack(r)}</span>
        </header>
        <ul className="v2-rows">
          {r.lines.map((l, i) => (
            <li key={`${l.item}-${i}`}>
              <span className="v2-rows__l">
                <span>
                  {l.item} · {l.drafted} {l.unit} out
                </span>
                <span className="v2-rows__sub">
                  {l.returned} {l.unit} back · {conditionWords[l.condition] ?? l.condition} ·{" "}
                  {dispositionWords[l.disposition] ?? l.disposition}
                  {l.expiresOn ? ` · expires ${dayOf(l.expiresOn)}${l.expirySource ? ` (${l.expirySource === "invoice" ? "off the invoice" : "estimated"})` : ""}` : ""}
                </span>
              </span>
              <span className="v2-rows__r v2-num">{naira(l.returned)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="v2-sec" aria-label="Steps">
        <header className="v2-sec__h">
          <h4>Where it is</h4>
          <span>{v.label}</span>
        </header>
        <ul className="v2-rows">
          {r.steps.map((s, i) => (
            <li key={`${s.status}-${i}`}>
              <span className="v2-rows__l">
                <span>{statusView(s.status).label}</span>
                <span className="v2-rows__sub">
                  {[dayOf(s.at), personOf(s.by), s.note].filter(Boolean).join(" · ")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {r.drafted > 0 && (
        <p className="x-sub">
          {returnedPct(r)}% of what went out came back · credit {naira(r.credit)}
          {r.creditApplied > 0 ? ` · ${naira(r.creditApplied)} applied` : ""}
          {r.creditOnAccount > 0 ? ` · ${naira(r.creditOnAccount)} held on the account` : ""}
        </p>
      )}
    </div>
  );
}

/**
 * The API has no returns ledger yet. Nothing here is a row of data: it is what the screen will
 * show, in plain words, so the visitor is told the truth rather than shown an empty table that
 * could pass for a working one. The call behind it lives in lib/returns-contract.ts.
 */
function NotYet() {
  const steps: Array<[string, string]> = [
    ["Drafted", "A shop says what came back, and why."],
    ["Agreed", "You agree to the pickup before anything moves."],
    ["Collected", "The rep picks the goods up, and Mimi records what actually came off the van."],
    ["Checked", "The depot counts it: good stock back on the shelf, damaged stock written off."],
    ["Credited", "One credit against what the shop owes. You approve it, and you can undo it."],
  ];
  return (
    <>
      <p className="x-sub">
        Not available yet. The returns ledger isn&apos;t connected to Mimi, so nothing here would be
        saved.
      </p>
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="package" />
          <h2>What this screen will show</h2>
        </div>
        <ul className="v2-rows">
          {steps.map(([name, what]) => (
            <li key={name}>
              <span className="v2-rows__l">
                <span>{name}</span>
                <span className="v2-rows__sub">{what}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="x-sub">
        Each open return will sit at one of those steps, with its lines and the reason, what came
        back, and where the goods went. The last step is a credit you approve, with an undo.
      </p>
    </>
  );
}
