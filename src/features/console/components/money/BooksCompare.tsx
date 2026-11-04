"use client";

import Link from "next/link";
import { useBooksAgreement } from "@/features/console/api/hooks";
import { refresh } from "@/features/console/api/sync";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { Button, ButtonLink } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { Note } from "@/features/console/components/ui/Note";
import { Table } from "@/features/console/components/ui/Table";
import { consoleRoutes, shopHref } from "@/features/console/config";
import type { BooksAgreement } from "@/features/console/content/books";
import { apartShops, booksState, booksWhole, booksWords, orderedShops, shopSectionWords, summaryWords } from "@/features/console/lib/two-books";

/**
 * Two books: what Mimi's book says Coral Lane is owed, against what Zoho Books reports, shop by shop
 * and as a total, with the shops that do not agree named first.
 *
 * Every figure is the API's own formatted string, including the difference; the console never adds
 * up or subtracts anything, and it says which book is higher in words rather than showing a signed
 * number. When Zoho Books is not connected there is nothing to compare, so the screen says that and
 * shows no figure at all: a nought would be a claim about a real accounting system.
 *
 * The same rule covers a book that is only half matched: while the API sends no Zoho figure for a
 * shop (not matched to a Zoho customer yet), the Zoho total and the difference are not shown at all,
 * and the screen says why in words (lib/two-books.ts, `booksWhole`). A total difference there would
 * be the figure for a comparison that did not happen.
 */
export function BooksView() {
  const { agreed, loading, missing, failed } = useBooksAgreement();

  /* the topic line stands in until there is a comparison to state; Compared opens on its point instead */
  const topic = <p className="x-sub">Mimi&apos;s book against Zoho Books.</p>;
  if (loading) return <SkeletonRows count={5} />;
  if (missing)
    return (
      <>
        {topic}
        <NotYet />
      </>
    );
  /* a read that failed says so, and is not the same as "not connected" */
  if (failed)
    return (
      <>
        {topic}
        <EmptyState>Mimi couldn&apos;t read both books just now.</EmptyState>
        <Note>
          <Button size="sm" variant="ghost" onClick={() => void refresh(true)}>
            Try again
          </Button>
        </Note>
      </>
    );
  /* nothing readable: the honest note, never an empty comparison that would read as agreement */
  if (!agreed)
    return (
      <>
        {topic}
        <NotYet />
      </>
    );
  if (agreed.connected === false)
    return (
      <>
        {topic}
        <NotConnected />
      </>
    );
  return <Compared v={agreed} />;
}

/** The two books, side by side. Nothing on this screen is added up or subtracted by the console. */
function Compared({ v }: { v: BooksAgreement }) {
  const shops = orderedShops(v);
  const total = booksState(v.total);
  /* whether the whole book can be compared at all: a shop Zoho has no figure for was not compared */
  const whole = booksWhole(v);
  const summary = summaryWords(v);
  const section = shopSectionWords(v);
  const apart = apartShops(v).length;
  const n = v.shops.length;
  const allAgree = whole.kind === "whole" && total.kind === "agreed" && apart === 0;

  return (
    <>
      {/* the point first, facts in ink: the books agree on the API's own total, or how many shops differ */}
      {allAgree ? (
        <p className="x-sub">
          Both books agree on <b>{v.total.mimi}</b> across <b>{n === 1 ? "1 shop" : `${n} shops`}</b>.
        </p>
      ) : whole.kind === "whole" && apart > 0 ? (
        <p className="x-sub">
          <b>
            {apart} of {n} shops
          </b>{" "}
          differ.
          {total.kind === "apart" && total.amount ? (
            <>
              {" "}
              All together the books are <b>{total.amount}</b> apart.
            </>
          ) : null}
        </p>
      ) : summary ? (
        <p className="x-sub">{summary}</p>
      ) : (
        <p className="x-sub">Mimi&apos;s book against Zoho Books.</p>
      )}

      <div className="x-kpis">
        <Figure value={v.total.mimi} what="Mimi's book" />
        {whole.kind === "whole" ? (
          <>
            <Figure value={v.total.zoho} what="Zoho Books" />
            <Figure value={v.total.difference} what="Difference" />
          </>
        ) : (
          /* not comparable as a whole: the sentence takes the place of the two figures, so no figure
             is shown for a comparison that did not happen */
          <div className="x-kpi x-cmp-na">{whole.line}</div>
        )}
      </div>

      {whole.kind === "whole" && !allAgree ? (
        <p className="x-sub">
          {total.kind === "agreed"
            ? "Both books agree, every shop taken together."
            : `All shops together, ${booksWords(total, "Zoho Books")}.`}
          {/* the note explains which way a difference points; with nothing apart it only adds words (Rico cut, 4 Nov) */}
          {v.note && total.kind !== "agreed" ? ` ${v.note}` : ""}
        </p>
      ) : null /* not comparable: the API's note explains a difference that is not shown, so it stays out */}

      <div className="x-grp">
        <div className="x-gh">
          <Icon name="store" />
          <h2>{section.heading}</h2>
          <span className="x-num">{section.count}</span>
        </div>
        {shops.length === 0 ? (
          <EmptyState>Neither book has a shop yet</EmptyState>
        ) : (
          <Table label="Two books" className="x-dt--phone-fit">
            <thead>
              <tr>
                <th scope="col">Shop</th>
                {/* phones: one figure when both agree, the verdict when they do not; never a sideways scroll */}
                <th scope="col" className={allAgree ? "r" : "r mc-hide-phone"}>
                  Mimi&apos;s book
                </th>
                <th scope="col" className="r mc-hide-phone">
                  Zoho Books
                </th>
                {!allAgree && <th scope="col">Where they stand</th>}
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => {
                const state = booksState(s);
                return (
                  <tr key={s.id} className="is-link">
                    <td>
                      <Link href={shopHref(s.id)} scroll={false} aria-label={`Open ${s.name}`}>
                        {s.name}
                      </Link>
                    </td>
                    <td className={allAgree ? "r x-ink" : "r x-ink mc-hide-phone"}>{s.mimi || <span className="x-mu">No figure</span>}</td>
                    <td className="r x-ink mc-hide-phone">{s.zoho || <span className="x-mu">No figure</span>}</td>
                    {!allAgree && (
                      <td className={state.kind === "agreed" ? "x-mu" : "x-ink"}>{booksWords(state, "Zoho Books")}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {shops.length > 0 && (
          <p className="x-tfoot">
            {shops.length} {shops.length === 1 ? "shop" : "shops"} · {allAgree ? "largest first" : "shops that differ first, then largest"}
          </p>
        )}
      </div>

      {!allAgree && (
      <p className="x-sub">
        Mimi&apos;s book is what her own records say each shop owes. Zoho Books is what the accounting
        system reports. Where the two disagree, the difference is the API&apos;s own figure, and the
        shop is worth a look before anything is promised.
      </p>
      )}
    </>
  );
}

/** One figure, exactly as the API formatted it. Never a figure the console worked out. */
function Figure({ value, what }: { value: string; what: string }) {
  return (
    <div className="x-kpi">
      <b className={value ? undefined : "x-mu"}>{value || "No figure"}</b>
      <span>{what}</span>
    </div>
  );
}

/**
 * Zoho Books is not connected, and the API said so. No figure appears on this screen at all: a
 * nought would read as an empty book, and this is a real accounting system.
 */
function NotConnected() {
  return (
    <>
      <p className="x-sub">
        Not available yet. Zoho Books isn&apos;t connected to Mimi, so there is nothing to compare
        her book against.
      </p>
      <Note>
        <span>No figure is shown here, because nothing was read. Mimi&apos;s own book is on Money at risk.</span>
        <ButtonLink size="sm" variant="ghost" href={consoleRoutes.money}>
          Money at risk
        </ButtonLink>
      </Note>
    </>
  );
}

/**
 * The API has no two books read yet, or answered with a shape this console does not know. Nothing
 * here is a row of data: it is what the screen will show, in plain words, so the visitor is told the
 * truth rather than shown a comparison that would pass for a real one. The call behind it lives in
 * lib/two-books-contract.ts. The wording makes no claim about Zoho Books: whether it is connected is
 * the API's to say, and it says it through `zoho_connected`.
 */
function NotYet() {
  return (
    <>
      <p className="x-sub">
        Not available yet. This console can&apos;t read the two books yet, so nothing here would be
        compared.
      </p>
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="book-text" />
          <h2>What this screen will show</h2>
        </div>
        <ul className="v2-rows">
          {[
            ["Both books, side by side", "What Mimi's book says each shop owes, and what Zoho Books reports."],
            ["The difference", "The API's own figure for the gap, never one the console works out."],
            ["Which book is higher", "Said in words, per shop and for the whole book, so no sign has to be read."],
            ["Shops that do not agree", "Named first, biggest gap at the top, so they are easy to find."],
          ].map(([name, what]) => (
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
        Every figure and every sentence there will come from the API. Until then nothing is shown,
        because an empty comparison would read as two books that agree.
      </p>
    </>
  );
}
