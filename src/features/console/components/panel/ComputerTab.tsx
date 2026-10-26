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

/** The desktop clock and date (the panel only renders on the client, after a click). */
function useClock(): { time: string; date: string } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  return {
    time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
  };
}

/*
 * The helper's cloud computer, drawn as a familiar Windows-style desktop (owners here know
 * Windows). Generic icons only: no real logos or trademarks. Everything on it is synthetic.
 */
type AppKey = "web" | "files" | "sheet" | "term";

/** Small generic app icons for the taskbar and title bars. */
function AppIcon({ app }: { app: AppKey }) {
  switch (app) {
    case "web":
      return (
        <svg viewBox="0 0 20 20" className="mc-pc__ic">
          <circle cx="10" cy="10" r="7.5" fill="#3b82c4" />
          <path
            d="M2.5 10h15M10 2.5c2.4 2.2 2.4 12.8 0 15M10 2.5c-2.4 2.2-2.4 12.8 0 15"
            fill="none"
            stroke="#dbeafe"
            strokeWidth="1.1"
          />
        </svg>
      );
    case "files":
      return (
        <svg viewBox="0 0 20 20" className="mc-pc__ic">
          <path
            d="M2.5 5.5a1 1 0 0 1 1-1h4l1.6 1.8h7.4a1 1 0 0 1 1 1v8.2a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z"
            fill="#e3b341"
          />
          <path d="M2.5 8h15v7.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" fill="#f2c94c" />
        </svg>
      );
    case "sheet":
      return (
        <svg viewBox="0 0 20 20" className="mc-pc__ic">
          <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" fill="#2f8f5b" />
          <path d="M6 6.5h8M6 10h8M6 13.5h8M9 5v10" stroke="#d1fae5" strokeWidth="1.1" />
        </svg>
      );
    case "term":
      return (
        <svg viewBox="0 0 20 20" className="mc-pc__ic">
          <rect
            x="2.5"
            y="3.5"
            width="15"
            height="13"
            rx="2"
            fill="#2b2b2b"
            stroke="#6b6b6b"
            strokeWidth=".8"
          />
          <path
            d="M5.5 8l2.5 2-2.5 2M9.5 12.5h4"
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/** Windows-style title bar: app icon and title on the left, minimise / maximise / close on the right. */
function Caption() {
  return (
    <span className="mc-pc__cap" aria-hidden="true">
      <svg viewBox="0 0 10 10">
        <path d="M1 5.5h8" />
      </svg>
      <svg viewBox="0 0 10 10">
        <rect x="1.5" y="1.5" width="7" height="7" rx="1" />
      </svg>
      <svg viewBox="0 0 10 10">
        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
      </svg>
    </span>
  );
}

/** Shop book sheet behind the browser, so the desktop feels like a real one (synthetic). */
const SHEET = [
  ["Shop", "Owes ₦", "Days"],
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
          {c.status === "user"
            ? "You are using the computer"
            : `${c.helper} ${c.status === "idle" || c.status === "done" ? "used" : "is using"} the computer`}
          <span className="mc-mono">
            <i
              className={cx("mc-dot", c.status !== "live" && "is-off", c.status === "user" && "is-user")}
              aria-hidden="true"
            />
            {STATUS[c.status]} · {c.activity}
          </span>
        </div>
        <div className="mc-cstat__btns">
          <button
            type="button"
            className="mc-btn mc-btn--sm"
            disabled={!busy}
            aria-pressed={c.status === "paused"}
            onClick={pauseComputer}
          >
            <Icon name={c.status === "paused" ? "play" : "pause"} />
            {c.status === "paused" ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            className="mc-btn mc-btn--sm mc-btn--pri"
            aria-pressed={c.status === "user"}
            onClick={takeControl}
          >
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

      <div className={cx("mc-scr mc-pc", c.status === "user" && "is-user")}>
        {(c.status === "user" || c.status === "paused") && (
          <div className="mc-scr__banner" role="status">
            <span className="mc-mono">
              {c.status === "user"
                ? `You have control · ${c.helper} is waiting`
                : `Paused · ${c.helper} stopped at step ${cur + 1}`}
            </span>
            <button
              type="button"
              className="mc-btn mc-btn--sm"
              onClick={c.status === "user" ? takeControl : pauseComputer}
            >
              {c.status === "user" ? "I'm done" : "Resume"}
            </button>
          </div>
        )}
        <div className="mc-pc__desk">
          <div className="mc-pc__win mc-pc__win--sheet" aria-hidden="true">
            <div className="mc-pc__tb">
              <AppIcon app="sheet" />
              <span className="mc-pc__t">Shop book.xlsx · Sheet</span>
              <Caption />
            </div>
            <div className="mc-pc__menu">
              <span>File</span>
              <span className="is-on">Home</span>
              <span>Insert</span>
              <span>Data</span>
              <span>View</span>
            </div>
            <div className="mc-pc__fx">
              <span className="mc-pc__cell">B3</span>
              <i>fx</i>
              <span>91000</span>
            </div>
            <table className="mc-pc__grid">
              <thead>
                <tr>
                  <th />
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                </tr>
              </thead>
              <tbody>
                {SHEET.map((r, i) => (
                  <tr key={i}>
                    <th>{i + 1}</th>
                    {r.map((x, j) => (
                      <td key={j} className={cx(i === 0 && "is-h", i === 2 && j === 1 && "is-sel")}>
                        {x}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mc-pc__tabs">
              <span className="is-on">Owed</span>
              <span>Paid</span>
            </div>
          </div>

          <div className="mc-pc__win mc-pc__win--web">
            <div className="mc-pc__tb mc-pc__tb--tabs" aria-hidden="true">
              <span className="mc-pc__tab is-on">
                <span className="mc-pc__fav">GT</span>
                <span className="mc-pc__tabt">GTBank Internet Banking</span>
                <span className="mc-pc__x">×</span>
              </span>
              <span className="mc-pc__tab">
                <span className="mc-pc__fav mc-pc__fav--wa" />
                <span className="mc-pc__tabt">WhatsApp</span>
              </span>
              <span className="mc-pc__plus">+</span>
              <Caption />
            </div>
            <div className="mc-pc__nav">
              <span className="mc-pc__navb" aria-hidden="true">
                <svg viewBox="0 0 12 12">
                  <path d="M7.5 2.5L4 6l3.5 3.5" />
                </svg>
                <svg viewBox="0 0 12 12">
                  <path d="M4.5 2.5L8 6 4.5 9.5" />
                </svg>
                <svg viewBox="0 0 12 12">
                  <path d="M9.5 6a3.5 3.5 0 1 1-1-2.5M9.5 1.8v2.4H7.1" />
                </svg>
              </span>
              <span className="mc-pc__url">
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
                  <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" />
                </svg>
                <b>{c.url}</b>
              </span>
            </div>
            <div className="mc-pc__body">
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
                      <tr
                        key={`${r.date}-${r.narration}`}
                        className={cx(r.mark && `is-${r.mark}`, r.isNew && "is-new")}
                      >
                        <td>{r.date}</td>
                        <td className="mc-bank__nar">
                          {r.narration}
                          {c.cursorRow === i && c.status !== "idle" && (
                            <span className="mc-cur" aria-hidden="true">
                              <svg viewBox="0 0 18 18">
                                <path
                                  d="M2 1l13 7-6 1.5L6.5 16z"
                                  fill="#101010"
                                  stroke="#fff"
                                  strokeWidth="1.2"
                                />
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

        <div className="mc-pc__bar" aria-hidden="true">
          <span className="mc-pc__dock">
            <span className="mc-pc__start">
              <svg viewBox="0 0 20 20">
                <rect x="3" y="3" width="14" height="14" rx="4" />
                <circle cx="10" cy="10" r="2.6" />
              </svg>
            </span>
            <span className="mc-pc__search">
              <svg viewBox="0 0 12 12">
                <circle cx="5.2" cy="5.2" r="3.4" />
                <path d="M7.8 7.8L10.5 10.5" />
              </svg>
              Search
            </span>
            {(
              [
                ["web", "focus"],
                ["files", ""],
                ["sheet", "open"],
                ["term", ""],
              ] as const
            ).map(([app, st]) => (
              <span key={app} className={cx("mc-pc__app", st && `is-${st}`)}>
                <AppIcon app={app} />
              </span>
            ))}
          </span>
          <span className="mc-pc__tray">
            <svg viewBox="0 0 12 12">
              <path d="M3 7.5L6 4.5l3 3" />
            </svg>
            <svg viewBox="0 0 14 12">
              <path d="M1.5 4.5a8 8 0 0 1 11 0M3.5 6.7a5 5 0 0 1 7 0M5.5 8.8a2 2 0 0 1 3 0" />
            </svg>
            <svg viewBox="0 0 14 12">
              <path d="M2 4.5h2.2L7 2v8L4.2 7.5H2zM9.5 4a3 3 0 0 1 0 4" />
            </svg>
            <span className="mc-pc__clock">
              <span>{time.time}</span>
              <span>{time.date}</span>
            </span>
          </span>
        </div>
      </div>

      <div className={cx("mc-sst", log && "is-open")}>
        {log && (
          <ol className="mc-steps" aria-label="Step log">
            {c.steps.map((s, i) => (
              <li key={i} className="mc-st">
                <span
                  className={cx("mc-st__k", s.state === "done" && "is-d", s.state === "run" && "is-r")}
                  aria-hidden="true"
                />
                <span>
                  {s.label}
                  {s.detail && <small>{s.detail}</small>}
                </span>
                <span className="mc-mono">{s.at}</span>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          className="mc-sst__row"
          aria-expanded={log}
          onClick={() => setLog(!log)}
          disabled={!c.steps.length}
        >
          <span
            className={cx("mc-st__k", step?.state === "run" ? "is-r" : step ? "is-d" : "")}
            aria-hidden="true"
          />
          <span className="mc-sst__t">
            {step ? step.label : `Nothing running. Ask ${c.helper} to check a payment.`}
          </span>
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
