"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { USES_API } from "@/features/console/api/config";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";
import { triggerLabel } from "@/features/console/content/automations";
import { conversationHref, toggleAutomation } from "@/features/console/demo/engine";
import { NOTHING_YET, faceStateLabel, rosterRow, type RosterName } from "@/features/console/demo/roster";
import { helperJobs } from "@/features/console/demo/seed";
import { useDemo } from "@/features/console/demo/store";
import type { Conversation } from "@/features/console/demo/types";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${n.toLocaleString("en-US")}`;
const runWord = { done: "Done", needs: "Waiting on you", failed: "Failed, retried", run: "Running" } as const;

type Filter = "all" | "needs" | "working" | "done";
const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs", label: "Waiting on you" },
  { id: "working", label: "Working" },
  { id: "done", label: "Done" },
];
const inFilter = (c: Conversation, f: Filter) =>
  f === "all" ||
  (f === "needs"
    ? c.state === "needs"
    : f === "working"
      ? c.state === "run" || c.working
      : c.state === "done");
const stateWord = (c: Conversation) =>
  c.state === "needs"
    ? "Waiting on you"
    : c.state === "run" || c.working
      ? "Working"
      : c.state === "done"
        ? "Done"
        : "";

/**
 * One helper's own inbox (/console/helpers/[name]), in two panes on a wide screen: her tasks on
 * the left (filter chips, each row opens the task's thread), and on the right who she is, what
 * she is doing now, what she costs today and her routines (last run, run history, an Active
 * toggle). Routines live with the helper that runs them (Grok Bot lesson); the full list stays at
 * Automations. Below 1100px the panes stack, tasks first.
 */
export function HelperView({ name }: { name: RosterName }) {
  const conversations = useDemo((s) => s.conversations);
  const typing = useDemo((s) => s.typing);
  const computer = useDemo((s) => s.computer);
  const autos = useDemo((s) => s.autos);
  const on = useDemo((s) => s.automations);
  const say = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const row = useMemo(
    () => rosterRow({ conversations, typing, computer }, name),
    [conversations, typing, computer, name],
  );
  const mine = autos.filter((a) => (name === "Mimi" ? false : a.helper === name));
  const threads = conversations.filter((c) => c.helper === name);
  const shown = threads.filter((c) => inFilter(c, filter));
  const waiting = threads.filter((c) => c.state === "needs").length;
  const job = name === "Mimi" ? "Routes your asks to the team" : helperJobs[name];

  return (
    <div className="mc-hv">
      <div className="mc-hv2__head">
        <HelperFace name={name} size={32} state={row.state} dot={row.needs > 0} />
        <h1>{name}</h1>
        {row.thread && (
          <Link className="mc-btn mc-btn--pri" href={conversationHref(row.thread)}>
            Message {name}
          </Link>
        )}
      </div>
      <p className="x-sub">
        {job}.{" "}
        {threads.length > 0 && (
          <>
            <b>{threads.length}</b> {threads.length === 1 ? "task" : "tasks"}
            {waiting > 0 ? (
              <>
                , <b>{waiting}</b> waiting on you.
              </>
            ) : (
              ", nothing waiting on you."
            )}
          </>
        )}
      </p>
      <div className="mc-hv2">
        <section className="mc-hv2__main" aria-label={`${name}'s tasks`}>
          {/* no tasks at all: four chips that all say 0 are noise (copy cut, 4 Nov) */}
          {threads.length > 0 && (
          <div className="mc-hv2__chips" role="group" aria-label="Show tasks">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="mc-hv2__chip"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span>{threads.filter((c) => inFilter(c, f.id)).length}</span>
              </button>
            ))}
          </div>
          )}

          {shown.length ? (
            <ul className="mc-hv2__list">
              {shown.map((c) => {
                const st = stateWord(c);
                return (
                  <li key={c.slug}>
                    <Link className="mc-hv2__row" href={conversationHref(c)}>
                      <span className="mc-hv2__t">{c.title}</span>
                      <span className="mc-hv2__p">{c.preview}</span>
                      <span className="mc-hv2__meta">
                        {st && (
                          <span
                            className={cx(
                              "mc-hv2__st",
                              c.state === "needs"
                                ? "is-needs"
                                : c.state === "done"
                                  ? "is-done"
                                  : "is-working",
                            )}
                          >
                            <i aria-hidden="true" />
                            {st}
                          </span>
                        )}
                        <span className="mc-hv2__ago">{c.ago}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mc-hv2__empty">
              {threads.length ? "No tasks in this view." : "No tasks yet."}
            </p>
          )}
        </section>

        <aside className="mc-hv2__side" aria-label={`About ${name}`}>
          <h2 className="mc-hv2__sh">Now</h2>
          <dl className="mc-hv__facts">
            <div>
              <dt>Status</dt>
              <dd>
                <span
                  className={cx(
                    "mc-hv2__st",
                    row.state === "waiting" || row.state === "blocked" ? "is-needs" : row.state === "working" ? "is-working" : "is-done",
                  )}
                >
                  <i aria-hidden="true" />
                  {/* the step often starts with the state ("Waiting on you to approve…"): say it once */}
                  {row.step.toLowerCase().startsWith(faceStateLabel[row.state].toLowerCase()) ? row.step : faceStateLabel[row.state]}
                </span>
                {/* an idle helper's step is only "Done": the state already says it (copy cut, 4 Nov) */}
                {row.state !== "idle" && !row.step.toLowerCase().startsWith(faceStateLabel[row.state].toLowerCase()) && row.step}
              </dd>
            </div>
            {(row.costToday > 0 || row.steps > 0) && (
              <div>
                <dt>Today</dt>
                <dd>
                  {naira(row.costToday)} · {row.steps} steps
                </dd>
              </div>
            )}
            {row.preview !== NOTHING_YET && (
              <div>
                <dt>Outcome</dt>
                <dd>{row.preview}</dd>
              </div>
            )}
          </dl>

          {/* routines and automations are sample data: the API build has no routes for them yet */}
          {!USES_API && (
            <div className="mc-hv2__sec">
              <h2 className="mc-hv2__sh">Routines</h2>
              {mine.length ? (
                <ul className="mc-hv__list" aria-label={`${name}'s routines`}>
                  {mine.map((a) => {
                    const live = !!on[a.id];
                    const last = a.runs[0];
                    return (
                      <li key={a.id} className="mc-rt">
                        <Icon name={a.trigger.kind === "schedule" ? "calendar-clock" : "zap"} />
                        <span className="mc-rt__tx">
                          <Link
                            href={
                              a.created
                                ? `${consoleRoutes.automations}/view?id=${a.id}`
                                : `${consoleRoutes.automations}/${a.id}`
                            }
                            className="mc-rt__t"
                          >
                            {a.title}
                          </Link>
                          <small>
                            {triggerLabel(a.trigger)}
                            {last ? ` · last run ${last.at} · ${runWord[last.status]}` : " · never run"}
                          </small>
                          {a.runs.length > 0 && (
                            <span className="mc-rt__runs" aria-label="Run history">
                              {a.runs.slice(0, 6).map((r) => (
                                <i
                                  key={r.id}
                                  className={cx("mc-rt__r", `is-${r.status}`)}
                                  title={`${r.at} · ${r.summary}`}
                                />
                              ))}
                            </span>
                          )}
                        </span>
                        <span className="mc-rt__sw">
                          <span className="mc-rt__on">{live ? "Active" : "Paused"}</span>
                          <button
                            className="c-toggle"
                            type="button"
                            role="switch"
                            aria-checked={live}
                            aria-label={`${a.title} active`}
                            onClick={() => {
                              toggleAutomation(a.id, !live);
                              sfx("console", "toggle", { direction: !live ? "forward" : "back" });
                              say(`${a.title} ${!live ? "is active" : "paused"}`);
                            }}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mc-hv__none">
                  {name === "Mimi"
                    ? "Mimi runs no routines of her own. She hands work to the team."
                    : `${name} has no routines yet. Ask her in a thread, e.g. "do this every Monday".`}
                </p>
              )}
              <Link className="mc-hv__all" href={consoleRoutes.automations}>
                All automations
                <Icon name="chevron-right" />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
