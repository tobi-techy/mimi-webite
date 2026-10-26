"use client";

import { useEffect, useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { pauseComputer, setPanelFull, takeControl } from "@/features/console/demo/engine";
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

/** The desktop clock (the panel only renders on the client, after a click). */
function useClock(): string {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  return now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/** A window title bar: three hairline buttons and the title. */
function TitleBar({ title, active }: { title: string; active?: boolean }) {
  return (
    <div className={cx("mc-win__bar", active && "is-active")}>
      <span className="mc-win__btns" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="mc-win__t">{title}</span>
    </div>
  );
}

/** Shop book sheet behind the browser, so the desktop feels like a real one (synthetic). */
const SHEET = [
  ["Shop", "Owes", "Days"],
  ["Chuks & Sons", "62,400", "9"],
  ["Joy Supermarket", "91,000", "6"],
  ["Bright Star", "58,000", "5"],
  ["Ola & Daughters", "54,500", "4"],
  ["Kola Mart", "120,000", "3"],
];

/** The computer a helper is driving: status + controls, the screen edge to edge, a one-line step strip. */
export function ComputerTab() {
  const c = useDemo((s) => s.computer);
  const [log, setLog] = useState(false);
  const runIdx = c.steps.findIndex((s) => s.state === "run");
  const cur = runIdx >= 0 ? runIdx : c.steps.length - 1;
  const step = c.steps[cur];
  const busy = c.status === "live" || c.status === "paused";
  const full = useDemo((s) => s.panel.full);
  const time = useClock();

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
            <Icon name={c.status === "user" ? "check" : "hand"} />
            {c.status === "user" ? "I'm done" : "Take control"}
          </button>
          <button
            type="button"
            className="mc-ib mc-cfull"
            aria-label={full ? "Back to the panel" : "Full screen"}
            title={full ? "Back to the panel (Esc)" : "Full screen"}
            onClick={() => setPanelFull(!full)}
          >
            <Icon name={full ? "minimize-2" : "maximize-2"} />
          </button>
        </div>
      </div>

      <div className={cx("mc-scr mc-desk", c.status === "user" && "is-user")}>
        {(c.status === "user" || c.status === "paused") && (
          <div className="mc-scr__banner" role="status">
            <span className="mc-mono">
              {c.status === "user" ? `You have control · ${c.helper} is waiting` : `Paused · ${c.helper} stopped at step ${cur + 1}`}
            </span>
            <button type="button" className="mc-btn mc-btn--sm" onClick={c.status === "user" ? takeControl : pauseComputer}>
              {c.status === "user" ? "I'm done" : "Resume"}
            </button>
          </div>
        )}
        <div className="mc-desk__top" aria-hidden="true">
          <span className="mc-desk__who">
            <i className={cx("mc-dot", c.status !== "live" && "is-off")} />
            {c.helper}&apos;s computer
          </span>
          <span className="mc-desk__menu">File · Edit · View · Window</span>
          <span className="mc-desk__time">{time}</span>
        </div>
        <div className="mc-desk__area">
          <div className="mc-win mc-win--back" aria-hidden="true">
            <TitleBar title="Shop book · Sheet" />
            <table className="mc-sheet">
              <tbody>
                {SHEET.map((r, i) => (
                  <tr key={i}>
                    {r.map((x, j) => (i === 0 ? <th key={j}>{x}</th> : <td key={j}>{x}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mc-win mc-win--front">
            <TitleBar title="GTBank Internet Banking" active />
            <div className="mc-url">
              <span aria-hidden="true">‹ ›</span>
              <b>{c.url}</b>
            </div>
            <div className="mc-win__body">
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
          </div>
        </div>
        <div className="mc-desk__dock" aria-label="Apps open on the computer">
          {(
            [
              ["search", "Browser", true],
              ["sheet", "Sheet", true],
              ["whatsapp", "WhatsApp", false],
              ["folder", "Files", false],
            ] as const
          ).map(([icon, name, open]) => (
            <span key={name} className={cx("mc-desk__app", open && "is-open")} title={name}>
              <Icon name={icon} />
            </span>
          ))}
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
