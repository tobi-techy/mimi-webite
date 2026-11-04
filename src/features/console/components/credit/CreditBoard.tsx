"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ActionGroup } from "@/features/console/components/ui/ActionGroup";
import { Avatar, Identity } from "@/features/console/components/ui/Avatar";
import { BookUnreachable } from "@/features/console/components/live/BookUnreachable";
import { Icon } from "@/features/console/components/ui/Icon";
import { MiniBar, ScoreTicks } from "@/features/console/components/ui/Meter";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { shopHref } from "@/features/console/config";
import { liveDecideCredit } from "@/features/console/api/actions";
import { useCreditBook } from "@/features/console/api/hooks";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import type { CreditLine, CreditRecommendation } from "@/features/console/content/credit";
import { useToast } from "@/features/console/hooks/use-toast";
import { naira } from "@/features/console/lib/format";
import { Table } from "@/features/console/components/ui/Table";
import { Button } from "@/features/console/components/ui/Button";
import { openLimitFor } from "@/features/console/components/credit/limit-entry";
import { useLimits } from "@/features/console/lib/credit-limits";

type Tab = "all" | "late" | "rec";
const suggestsChange = (l: CreditLine): boolean => /^(Raise|Lower)/.test(l.recommendation);
/* "No change" and "Hold" say nothing happens: the cell stays empty so a real suggestion stands out */
const quietRec = (r: string): boolean => /^(no change|hold)\.?$/i.test(r.trim());
const used = (l: CreditLine, limit: number): number => (limit > 0 ? l.shop.owed / limit : 0);
/** Urgency: a suggested change first, then overdue, then the most of its limit in use. */
const urgency = (l: CreditLine): number => (suggestsChange(l) ? 2 : 0) + (l.late ? 1 : 0);

/**
 * Credit's point in one line, facts in ink: how many credit lines are overdue, and whether a limit
 * change waits on the owner. Counts only, read off the same lines the table shows.
 */
export function CreditHeadline() {
  const book = useCreditBook();
  if (book.loading || book.lines.length === 0) return null;
  const n = book.lines.length;
  const late = book.lines.filter((l) => l.late).length;
  const recs = book.recs.length;
  return (
    <p className="x-sub">
      {late > 0 ? (
        <>
          <b>
            {late} of {n} shops
          </b>{" "}
          are overdue.
        </>
      ) : (
        <>
          <b>All {n} shops</b> are paying on time.
        </>
      )}{" "}
      {recs > 0 ? (
        <>
          <b>
            {recs} limit {recs === 1 ? "change" : "changes"}
          </b>{" "}
          {recs === 1 ? "waits" : "wait"} on you.
        </>
      ) : (
        "No limit changes to review."
      )}
    </p>
  );
}

/** Recommended limit changes and the credit lines they apply to. Accepting updates the line. */
export function CreditBoard() {
  const router = useRouter();
  const say = useToast();
  const book = useCreditBook();
  const [lines, setLines] = useState<readonly CreditLine[]>(book.lines);
  const [recs, setRecs] = useState<readonly CreditRecommendation[]>(book.recs);
  /* the API's figures arrive (or change) after the first render: take them as they come */
  const [source, setSource] = useState(book);
  if (source.lines !== book.lines || source.recs !== book.recs) {
    setSource(book);
    setLines(book.lines);
    setRecs(book.recs);
  }
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  /* limits the owner set from the console (Set credit limit) */
  const set = useLimits((s) => s.set);

  function decide(rec: CreditRecommendation, accept: boolean) {
    const line = lines.find((l) => l.shop.id === rec.shopId);
    if (!line) return;
    /* accepting a suggestion is the owner setting a limit: the same sheet, prefilled with Credit's figure */
    if (accept) return openLimitFor(line.shop, { line, rec, prefill: rec.to });
    if (book.live && rec.approvalId) {
      /* a credit request from the API: not optimistic, the row goes only once the API agrees
         (the demo refuses raises to a credit limit and says so) */
      void liveDecideCredit(rec.approvalId, accept).then((r) => {
        if (r.ok) setRecs((now) => now.filter((x) => x !== rec));
        say(r.text);
      });
      return;
    }
    setRecs(recs.filter((r) => r !== rec));
    setLines(
      lines.map((l) =>
        l === line
          ? {
              ...l,
              limit: accept ? rec.to : l.limit,
              recommendation: accept ? `Set to ${naira(rec.to)} today` : "Hold",
            }
          : l,
      ),
    );
    say(
      accept
        ? `${line.shop.name} limit set to ${naira(rec.to)}`
        : `Dismissed: ${rec.verb.toLowerCase()} ${line.shop.name}`,
    );
  }

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    const limitOf = (l: CreditLine) => set[l.shop.id]?.limit ?? l.limit;
    return lines
      .filter(
        (l) =>
          (tab === "all" || (tab === "late" ? l.late : suggestsChange(l))) &&
          (!query || `${l.shop.name} ${l.shop.area} ${l.recommendation}`.toLowerCase().includes(query)),
      )
      .sort((a, b) => urgency(b) - urgency(a) || used(b, limitOf(b)) - used(a, limitOf(a)) || a.shop.name.localeCompare(b.shop.name));
  }, [lines, tab, q, set]);
  /* the Recommendation column only when some line has something to say */
  const showRec = useMemo(
    () => lines.some((l) => !quietRec(l.recommendation) || !!set[l.shop.id]),
    [lines, set],
  );
  /* the API has no credit score: show the column only when a line in the book really has one */
  const showScore = useMemo(() => lines.some((l) => !l.shop.live), [lines]);

  const open = recs.filter((r) => set[r.shopId]?.limit !== r.to).length;

  return (
    <>
      {/* nothing to review: the headline already says so, so the section goes (no "Nothing to review." row) */}
      {(book.loading || open > 0) && (
      <div className="x-card x-recs">
        {/* the count only when there is something to count: "· 0" beside "Nothing to review" said it twice */}
        <p className="x-rh">
          Recommended changes
          {open > 0 && <span className="x-num"> · {open}</span>}
        </p>
        {book.loading && <SkeletonRows count={2} />}
        {recs.filter((r) => set[r.shopId]?.limit !== r.to).map((r) => {
          const name = lines.find((l) => l.shop.id === r.shopId)?.shop.name ?? r.shopId;
          return (
            <div key={r.shopId} className="x-ri">
              <Avatar name={name} />
              <div>
                <b>
                  {r.verb} {name} to {naira(r.to)}
                </b>
                <small>{r.why}</small>
              </div>
              <Button size="sm" variant="ghost" onClick={() => decide(r, true)}>
                Review {naira(r.to)}
              </Button>
              <button
                className="x-ib"
                type="button"
                aria-label={`Dismiss: ${r.verb.toLowerCase()} ${name}`}
                onClick={() => decide(r, false)}
              >
                <Icon name="x" />
              </button>
            </div>
          );
        })}
      </div>
      )}
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="landmark" />
          <h2>Credit lines</h2>
          <span className="x-num">{lines.length}</span>
        </div>
        <div className="x-ltools">
          <SearchField label="Search credit lines" value={q} onChange={setQ} />
          <Segmented
            label="Credit lines"
            value={tab}
            onChange={setTab}
            segments={[
              { value: "all", label: "All", count: lines.length },
              { value: "late", label: "Overdue", count: lines.filter((l) => l.late).length },
              /* no segment that can only show nothing ("Change suggested 0") */
              ...(lines.some(suggestsChange)
                ? [{ value: "rec" as const, label: "Change suggested", count: lines.filter(suggestsChange).length }]
                : []),
            ]}
          />
        </div>
        {book.loading ? (
          <SkeletonRows count={6} />
        ) : rows.length === 0 ? (
          <BookUnreachable empty={lines.length ? "No credit lines match the current filters" : "No credit lines yet"} />
        ) : (
          <Table label="Credit lines" className="x-dt--phone-fit">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                <th scope="col" className="r">
                  Limit
                </th>
                {/* phones keep shop, limit and due; the row opens the shop for the rest */}
                <th scope="col" className="mc-hide-phone">Used</th>
                <th scope="col">Due</th>
                {showScore && <th scope="col" className="mc-hide-phone">Score</th>}
                {showRec && <th scope="col" className="mc-hide-phone">Recommendation</th>}
                <th scope="col" className="mc-hide-phone">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.shop.id} className="is-link" onClick={() => router.push(shopHref(l.shop.id))}>
                  <td>
                    <Link
                      href={shopHref(l.shop.id)}
                      aria-label={`Review ${l.shop.name}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Identity name={l.shop.name} sub={l.shop.area} />
                    </Link>
                  </td>
                  <td className="r x-ink">{naira(set[l.shop.id]?.limit ?? l.limit)}</td>
                  <td className="mc-hide-phone">
                    <MiniBar percent={(set[l.shop.id]?.limit ?? l.limit) > 0 ? (l.shop.owed / (set[l.shop.id]?.limit ?? l.limit)) * 100 : 0} />
                    <span className="x-num">{naira(l.shop.owed)}</span>
                  </td>
                  <td className={l.late ? "x-late" : undefined}>
                    {l.due}
                    {l.late && !l.shop.live && " · overdue"}
                  </td>
                  {showScore && (
                    <td className="x-num mc-hide-phone">
                      {l.shop.live ? (
                        <span className="x-mu">—</span>
                      ) : (
                        <ScoreTicks score={l.shop.score} />
                      )}
                    </td>
                  )}
                  {showRec && (
                    <td className="x-mu mc-hide-phone">
                      {set[l.shop.id] ? `Set to ${naira(set[l.shop.id]!.limit)} by you` : quietRec(l.recommendation) ? "" : l.recommendation}
                    </td>
                  )}
                  {/* one quiet action, shown on row hover or focus (always on touch screens) */}
                  <td className="r x-rowact mc-hide-phone">
                    <ActionGroup
                      row
                      label={`More for ${l.shop.name}`}
                      actions={["Set limit"]}
                      onAction={() => openLimitFor(l.shop, { line: l })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {!book.loading && rows.length > 0 && (
          <p className="x-tfoot">
            {rows.length} {rows.length === 1 ? "shop" : "shops"} · suggested changes and overdue first, then most of the limit in use
          </p>
        )}
      </div>
    </>
  );
}
