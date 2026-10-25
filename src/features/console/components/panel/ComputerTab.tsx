"use client";

import { useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { pauseComputer, takeControl } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import type { ComputerStatus } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const STATUS: Record<ComputerStatus, string> = {
  idle: "Idle",
  live: "Live",
  paused: "Paused",
  user: "You have control",
  done: "Done",
};

/** The computer a helper is driving: status + controls, the screen edge to edge, a one-line step strip. */
export function ComputerTab() {
  const c = useDemo((s) => s.computer);
  const [log, setLog] = useState(false);
  const runIdx = c.steps.findIndex((s) => s.state === "run");
  const cur = runIdx >= 0 ? runIdx : c.steps.length - 1;
  const step = c.steps[cur];
  const busy = c.status === "live" || c.status === "paused";

  return (
    <div className="mc-comp">
      <div className="mc-cstat">
        <HelperFace name={c.helper} size={16} ring={26} />
        <div className="mc-cstat__who">
          {c.status === "user" ? "You are using the computer" : `${c.helper} ${c.status === "idle" || c.status === "done" ? "used" : "is using"} the computer`}
          <span className="mc-mono">
            <i className={cx("mc-dot", c.status !== "live" && "is-off", c.status === "user" && "is-user")} aria-hidden="true" />
            {STATUS[c.status]} · {c.activity}
          </span>
        </div>
        <div className="mc-cstat__btns">
          <button type="button" className="mc-btn mc-btn--sm" disabled={!busy} aria-pressed={c.status === "paused"} onClick={pauseComputer}>
            <Icon name={c.status === "paused" ? "play" : "pause"} />
            {c.status === "paused" ? "Resume" : "Pause"}
          </button>
          <button type="button" className="mc-btn mc-btn--sm mc-btn--pri" aria-pressed={c.status === "user"} onClick={takeControl}>
            <Icon name="hand" />
            {c.status === "user" ? `Give back to ${c.helper}` : "Take control"}
          </button>
        </div>
      </div>

      <div className={cx("mc-scr", c.status === "user" && "is-user")}>
        {(c.status === "user" || c.status === "paused") && (
          <div className="mc-scr__banner" role="status">
            <span className="mc-mono">
              {c.status === "user" ? `You have control · ${c.helper} is waiting` : `Paused · ${c.helper} stopped at step ${cur + 1}`}
            </span>
            <button type="button" className="mc-btn mc-btn--sm" onClick={c.status === "user" ? takeControl : pauseComputer}>
              {c.status === "user" ? "Give back" : "Resume"}
            </button>
          </div>
        )}
        <div className="mc-url">
          <span aria-hidden="true">‹ ›</span>
          <b>{c.url}</b>
        </div>
        <div className="mc-bank">
          <div className="mc-bank__h">
            <div>
              <b>Account statement</b>
              <span>Wigmore Trading Ltd · ****4471</span>
            </div>
            <span className="mc-bank__lg">GTBank</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Narration</th>
                <th className="mc-n">Credit ₦</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r, i) => (
                <tr key={`${r.date}-${r.narration}`} className={cx(r.mark && `is-${r.mark}`, r.isNew && "is-new")}>
                  <td>{r.date}</td>
                  <td className="mc-bank__nar">
                    {r.narration}
                    {c.cursorRow === i && c.status !== "idle" && (
                      <span className="mc-cur" aria-hidden="true">
                        <svg viewBox="0 0 18 18">
                          <path d="M2 1l13 7-6 1.5L6.5 16z" fill="#101010" stroke="#fff" strokeWidth="1.2" />
                        </svg>
                        {c.tag && <span className="mc-ctag">{c.tag}</span>}
                      </span>
                    )}
                  </td>
                  <td className="mc-n">{r.credit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={cx("mc-sst", log && "is-open")}>
        {log && (
          <ol className="mc-steps" aria-label="Step log">
            {c.steps.map((s, i) => (
              <li key={i} className="mc-st">
                <span className={cx("mc-st__k", s.state === "done" && "is-d", s.state === "run" && "is-r")} aria-hidden="true" />
                <span>
                  {s.label}
                  {s.detail && <small>{s.detail}</small>}
                </span>
                <span className="mc-mono">{s.at}</span>
              </li>
            ))}
          </ol>
        )}
        <button type="button" className="mc-sst__row" aria-expanded={log} onClick={() => setLog(!log)} disabled={!c.steps.length}>
          <span className={cx("mc-st__k", step?.state === "run" ? "is-r" : step ? "is-d" : "")} aria-hidden="true" />
          <span className="mc-sst__t">{step ? step.label : `Nothing running. Ask ${c.helper} to check a payment.`}</span>
          {step && (
            <span className="mc-mono">
              Step {cur + 1} of {c.steps.length} · {step.at} {log ? "▴" : "▾"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
