"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";
import { triggerLabel } from "@/features/console/content/automations";
import { conversationHref, toggleAutomation } from "@/features/console/demo/engine";
import { faceStateLabel, rosterRow, type RosterName } from "@/features/console/demo/roster";
import { helperJobs } from "@/features/console/demo/seed";
import { useDemo } from "@/features/console/demo/store";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${n.toLocaleString("en-US")}`;
const runWord = { done: "Done", needs: "Waiting on you", failed: "Failed, retried", run: "Running" } as const;

/**
 * One helper's own view (/console/helpers/[name]): who she is and what she is doing now, what
 * she costs today, her routines (last run, run history, an Active toggle) and her threads.
 * Routines live with the helper that runs them (Grok Bot lesson); the full list stays at
 * Automations.
 */
export function HelperView({ name }: { name: RosterName }) {
  const conversations = useDemo((s) => s.conversations);
  const typing = useDemo((s) => s.typing);
  const computer = useDemo((s) => s.computer);
  const autos = useDemo((s) => s.autos);
  const on = useDemo((s) => s.automations);
  const say = useToast();
  const row = useMemo(() => rosterRow({ conversations, typing, computer }, name), [conversations, typing, computer, name]);
  const mine = autos.filter((a) => (name === "Mimi" ? false : a.helper === name));
  const threads = conversations.filter((c) => c.helper === name).slice(0, 6);
  const job = name === "Mimi" ? "Routes your asks to the team" : helperJobs[name];

  return (
    <div className="mc-hv">
      <div className="mc-hv__in">
        <div className="mc-hv__id">
          <HelperFace name={name} size={48} state={row.state} dot={row.needs > 0} />
          <div className="mc-hv__who">
            <h1>{name}</h1>
            <p>{job}</p>
          </div>
          {row.thread && (
            <Link className="mc-btn mc-btn--pri" href={conversationHref(row.thread)}>
              Message {name}
            </Link>
          )}
        </div>

        <dl className="mc-hv__facts">
          <div>
            <dt>Now</dt>
            <dd>
              <span className={cx("mc-hv__st", `is-${row.state}`)}>{faceStateLabel[row.state]}</span>
              {row.step}
            </dd>
          </div>
          <div>
            <dt>Today</dt>
            <dd>
              {naira(row.costToday)} · {row.steps} steps
            </dd>
          </div>
          <div>
            <dt>Outcome</dt>
            <dd>{row.preview}</dd>
          </div>
        </dl>

        <h2 className="mc-hv__h">Routines</h2>
        {mine.length ? (
          <ul className="mc-hv__list" aria-label={`${name}'s routines`}>
            {mine.map((a) => {
              const live = !!on[a.id];
              const last = a.runs[0];
              return (
                <li key={a.id} className="mc-rt">
                  <Icon name={a.trigger.kind === "schedule" ? "calendar-clock" : "zap"} />
                  <span className="mc-rt__tx">
                    <Link href={a.created ? `${consoleRoutes.automations}/view?id=${a.id}` : `${consoleRoutes.automations}/${a.id}`} className="mc-rt__t">
                      {a.title}
                    </Link>
                    <small>
                      {triggerLabel(a.trigger)}
                      {last ? ` · last run ${last.at} · ${runWord[last.status]}` : " · never run"}
                    </small>
                    {a.runs.length > 0 && (
                      <span className="mc-rt__runs" aria-label="Run history">
                        {a.runs.slice(0, 6).map((r) => (
                          <i key={r.id} className={cx("mc-rt__r", `is-${r.status}`)} title={`${r.at} · ${r.summary}`} />
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
            {name === "Mimi" ? "Mimi runs no routines of her own. She hands work to the team." : `${name} has no routines yet. Ask her in a thread, e.g. "do this every Monday".`}
          </p>
        )}
        <Link className="mc-hv__all" href={consoleRoutes.automations}>
          All automations
          <Icon name="chevron-right" />
        </Link>

        <h2 className="mc-hv__h">Tasks</h2>
        <ul className="mc-hv__list" aria-label={`${name}'s tasks`}>
          {threads.map((c) => (
            <li key={c.slug}>
              <Link className="mc-hv__th" href={conversationHref(c)}>
                <span className="mc-hv__tt">{c.title}</span>
                <small>{c.preview}</small>
                <span className="mc-hv__ago">{c.ago}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
