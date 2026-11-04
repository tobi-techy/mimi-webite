"use client";

import Link from "next/link";
import { useState } from "react";
import { liveSetRoutinePaused } from "@/features/console/api/actions";
import { useRoutines } from "@/features/console/api/hooks";
import { refresh } from "@/features/console/api/sync";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { Button } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { Note } from "@/features/console/components/ui/Note";
import { Pill } from "@/features/console/components/ui/Pill";
import { shopHref } from "@/features/console/config";
import { parseApiTime } from "@/features/console/api/mappers";
import { routineAction, routineLook, type Routine } from "@/features/console/content/routines";
import { readWords, routineLine } from "@/features/console/lib/routine-times";

/**
 * Routines: the work Mimi does on her own, one row each. The API owns the name, the schedule, the
 * finding and the paused state, and every one of them is shown as written; the console only words
 * the two times, in Lagos, and dates the list.
 *
 * A finding opens the shop it is about, but only when the API names that shop
 * (`last_finding_shop_id`). The console never guesses a link out of a sentence: a finding about
 * several shops, or about the book, stays plain text.
 *
 * Until this server has GET /v1/routines the screen says so in plain words. It never shows an empty
 * rail, which would read as "Mimi runs nothing" and would not be true, and a read that failed says
 * that instead, with the same Try again the other book pages offer.
 */
export function RoutinesView() {
  const { routines, asOf, ready, loading, missing, failed } = useRoutines();
  /* the times are worded once, when the screen opens: they are words, not a running clock */
  const [now] = useState(() => Date.now());
  const [busy, setBusy] = useState("");

  if (loading) return <SkeletonRows count={4} />;
  if (missing) return <NotYet />;
  if (failed)
    return (
      <>
        <EmptyState>Mimi couldn&apos;t read her routines just now.</EmptyState>
        <Note>
          <span>Nothing is wrong with them. They were not read, so nothing is shown.</span>
          <Button size="sm" variant="ghost" onClick={() => void refresh(true)}>
            Try again
          </Button>
        </Note>
      </>
    );
  /* no list was read: the honest note, never an empty rail that would read as "Mimi runs nothing" */
  if (!ready) return <NotYet />;
  if (routines.length === 0) return <EmptyState>Mimi has nothing running yet</EmptyState>;

  /* a write changes the row only after the API answers, so one at a time, and the row says so */
  const change = async (r: Routine) => {
    if (busy) return;
    setBusy(r.id);
    await liveSetRoutinePaused(r.id, !r.paused);
    setBusy("");
  };
  const running = routines.filter((r) => !r.paused).length;
  /* a row that says "last ran at 8:00" without a date invites the argument a reconciliation needs a date for */
  const read = readWords(asOf, parseApiTime, now);

  return (
    <>
      {read && <p className="x-sub">{read} in Lagos time.</p>}
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="calendar-clock" />
          <h2>What Mimi runs on her own</h2>
          <span className="x-num">
            {running} of {routines.length} running
          </span>
        </div>
        <ul className="v2-rows">
          {routines.map((r) => {
            const look = routineLook(r);
            return (
              <li key={r.id} aria-busy={busy === r.id || undefined}>
                <span className="v2-rows__l">
                  <span>{r.name}</span>
                  <span className="rt-line">{routineLine(r, now)}</span>
                  {r.finding && (
                    <span className="rt-line">
                      Last time:{" "}
                      {r.findingShopId ? (
                        <Link
                          className="rt-link"
                          href={shopHref(r.findingShopId)}
                          scroll={false}
                          aria-label={`Open the shop this is about: ${r.finding}`}
                        >
                          {r.finding}
                        </Link>
                      ) : (
                        r.finding
                      )}
                    </span>
                  )}
                  {r.paused && r.pausedReason && <span className="rt-line">Paused: {r.pausedReason}</span>}
                </span>
                <span className="rt-act v2-rows__r">
                  <Pill tone={look.tone}>{look.label}</Pill>
                  <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => void change(r)}>
                    {routineAction(r)}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="x-sub">
        A paused routine does not run, and it says why it was paused. Resuming puts it back on its
        schedule. Nothing else on this screen changes what Mimi does.
      </p>
    </>
  );
}

/**
 * The API has no routines route yet. Nothing here is a row of data: it is what the screen will show,
 * in plain words, so the visitor is told the truth rather than shown an empty rail that could pass
 * for a working one. The call behind it lives in lib/routines-contract.ts.
 */
function NotYet() {
  return (
    <>
      <p className="x-sub">
        Not available yet. Mimi&apos;s routines aren&apos;t connected to the console, so nothing here
        would run or be paused.
      </p>
      <div className="x-grp">
        <div className="x-gh">
          <Icon name="calendar-clock" />
          <h2>What this screen will show</h2>
        </div>
        <ul className="v2-rows">
          {[
            ["The work Mimi does on her own", "One row per routine, named the way Mimi names it."],
            ["When it runs", "The schedule in words, and when it last ran and runs next, in Lagos time."],
            ["What it found", "One line on what the last run turned up, opening that shop when the API names it."],
            ["Pause and resume", "A routine can be paused, so it stops running, and resumed later."],
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
        Every figure and every sentence on that screen will come from the API, so what you read is
        what actually ran.
      </p>
    </>
  );
}
