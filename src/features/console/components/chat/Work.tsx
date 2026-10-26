"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Markdown } from "@/features/console/components/panel/Markdown";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { useDemo, findConversation } from "@/features/console/demo/store";
import type { Message, PlanItemState, WorkDetail, WorkPlan } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

/**
 * Every stage of a helper's work in the thread, Factory/Claude style: reasoning ("Thought for
 * 4s"), tool steps with live states, grouped steps, handoffs between helpers, approval gates,
 * errors and retries, and the live checklist pinned above the composer.
 */

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `**bold**` only (step copy). */
function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  text.split(/(\*\*.+?\*\*)/g).forEach((p, i) => {
    if (!p) return;
    out.push(p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p.replace(/\*\*/g, ""));
  });
  return <>{out}</>;
}

/* ---------- reasoning ---------- */

type Thought = Extract<Message, { kind: "thought" }>;

/** Streams the reasoning word by word while the helper is thinking. */
function useReveal(text: string, live: boolean): string {
  const words = text.split(" ");
  const [n, setN] = useState(() => (live && !reduced() ? 1 : words.length));
  useEffect(() => {
    if (!live || n >= words.length) return;
    const t = window.setTimeout(() => setN((x) => x + 1), 28);
    return () => window.clearTimeout(t);
  }, [n, words.length, live]);
  if (!live || n >= words.length) return text;
  let t = words.slice(0, n).join(" ");
  for (const mark of ["**", "`"]) {
    if (t.split(mark).length % 2 === 0) {
      const at = t.lastIndexOf(mark);
      t = t.slice(0, at) + t.slice(at + mark.length);
    }
  }
  return t;
}

export function ThoughtBlock({ m }: { m: Thought }) {
  const live = !!m.live;
  const [open, setOpen] = useState(!!m.open);
  const shown = useReveal(m.text, live);
  const expanded = live || open;
  const id = `th-${m.id}`;
  return (
    <div className={cx("mc-rs", live && "is-live", expanded && "is-open")}>
      <button
        type="button"
        className="mc-rs__h"
        aria-expanded={expanded}
        aria-controls={id}
        disabled={live}
        onClick={() => setOpen(!open)}
      >
        {live ? (
          <span className="mc-rs__t mc-shim" role="status" aria-live="polite">
            Thinking…
          </span>
        ) : (
          <span className="mc-rs__t">Thought for {m.secs ?? 2}s</span>
        )}
        {!live && <Icon name="chevron-right" className="i mc-rs__c" />}
      </button>
      {expanded && (
        <div className="mc-rs__b" id={id}>
          <Markdown text={shown} className="mc-md--msg mc-md--thought" />
        </div>
      )}
    </div>
  );
}

/* ---------- steps ---------- */

type StepMsg = Extract<Message, { kind: "step" }>;

function Detail({ d }: { d: WorkDetail }) {
  if (d.type === "kv")
    return (
      <dl className="mc-wd mc-wd--kv">
        {d.rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    );
  if (d.type === "code")
    return (
      <div className="mc-wd mc-wd--code">
        {d.label && <p className="mc-wd__l">{d.label}</p>}
        <pre>{d.text}</pre>
      </div>
    );
  if (d.type === "table")
    return (
      <div className="mc-wd mc-wd--table">
        <table>
          <thead>
            <tr>
              {d.head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return (
    <ul className="mc-wd mc-wd--list">
      {d.items.map((it) => (
        <li key={it.text}>
          <Icon name={(it.icon ?? "check") as IconName} />
          <span>{it.text}</span>
          {it.meta && <small>{it.meta}</small>}
        </li>
      ))}
    </ul>
  );
}

function StateMark({ state }: { state: StepMsg["state"] }) {
  if (state === "run") return <i className="mc-spin mc-ws__spin" aria-label="Running" role="img" />;
  if (state === "done") return <Icon name="check" className="i mc-ws__ok" />;
  if (state === "failed") return <span className="mc-ws__bad">Failed</span>;
  return <span className="mc-ws__wait">Needs you</span>;
}

/** Scrolls the decision card a gate waits on into view and flashes it. */
export function goToCard(messageId: string) {
  const el = document.getElementById(`m-${messageId}`);
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
  el.classList.remove("is-flash");
  void el.offsetWidth;
  el.classList.add("is-flash");
  window.setTimeout(() => el.classList.remove("is-flash"), 1400);
  (el.querySelector(".mc-apc__ft .mc-btn--pri") as HTMLElement | null)?.focus({ preventScroll: true });
}

/** The tool a step used, named from its icon when the step doesn't say. */
const TOOL_OF: Partial<Record<string, string>> = {
  landmark: "GTBank",
  "book-text": "Shop book",
  "message-square": "WhatsApp",
  send: "WhatsApp",
  monitor: "Computer",
  sheet: "Sheet",
  "file-text": "Docs",
  package: "Stock",
  search: "Search",
  "shield-check": "Proof check",
  "bar-chart": "Sales",
  store: "Shop list",
  receipt: "Invoices",
  "refresh-cw": "Retry",
  pen: "Draft",
  users: "Shops",
  truck: "Van route",
  "map-pin": "Map",
  folder: "Files",
  "list-checks": "Plan",
  "circle-x": "Error",
};

/**
 * Timing and naira for a step. Steps run in this demo carry their own; seeded steps get a stable
 * sample value from their id (synthetic demo data, the product reads it from the run trace).
 */
export function traceOf(m: { id: string; took?: string; cost?: number; icon?: string }): { took: string; cost: number } {
  let h = 2166136261;
  for (let i = 0; i < m.id.length; i++) h = Math.imul(h ^ m.id.charCodeAt(i), 16777619) >>> 0;
  const heavy = m.icon === "monitor" || m.icon === "landmark";
  const secs = ((h % 37) + 4) / 10 + (heavy ? 1.6 : 0);
  return { took: m.took ?? `${secs.toFixed(1)}s`, cost: m.cost ?? ((h >>> 7) % 4) + (heavy ? 3 : 1) };
}

/** Grey trace after a step: "· 1.2s · ₦3". */
function Trace({ m }: { m: StepMsg }) {
  if (m.state === "run") return <span className="mc-ws__tr"> · running</span>;
  const t = traceOf(m);
  return (
    <span className="mc-ws__tr">
      {" "}· {t.took} · ₦{t.cost}
    </span>
  );
}

export function StepLine({ m }: { m: StepMsg }) {
  const [open, setOpen] = useState(false);
  const can = !!m.detail;
  const icon: IconName =
    m.variant === "error" ? "circle-x" : m.variant === "retry" ? "refresh-cw" : m.variant === "gate" ? "hand" : ((m.icon ?? "check") as IconName);
  const lead =
    m.variant === "handoff" && m.to ? (
      <span className="mc-ws__hand" aria-hidden="true">
        <HelperFace name={m.from} size={14} />
        <Icon name="arrow-right" className="i mc-ws__arr" />
        <HelperFace name={m.to} size={14} />
      </span>
    ) : (
      <Icon name={icon} className="i mc-ws__i" />
    );
  const traced = m.variant === "tool" || m.variant === "retry" || m.variant === "error";
  const toolName = traced ? (m.tool ?? TOOL_OF[m.icon ?? ""] ?? "Tool") : undefined;
  const body = (
    <>
      {lead}
      <span className="mc-ws__t">
        {toolName && (
          <span className="mc-ws__tool">
            {toolName} <span aria-label="gave">→</span>{" "}
          </span>
        )}
        <Rich text={m.text} />
        {m.meta && <span className="mc-ws__m"> {m.meta}</span>}
        {traced && <Trace m={m} />}
      </span>
      {m.variant !== "handoff" && !(m.variant === "gate" && m.state === "wait") && <StateMark state={m.state} />}
      {can && <Icon name="chevron-right" className="i mc-ws__c" />}
    </>
  );
  return (
    <div className={cx("mc-ws", `mc-ws--${m.variant}`, `is-${m.state}`, open && "is-open")}>
      {can ? (
        <button type="button" className="mc-ws__h" aria-expanded={open} onClick={() => setOpen(!open)}>
          {body}
        </button>
      ) : (
        <div className="mc-ws__h">{body}</div>
      )}
      {m.variant === "gate" && m.link && m.state === "wait" && (
        <button type="button" className="mc-ws__go" onClick={() => goToCard(m.link!)}>
          Go to the decision
          <Icon name="arrow-up" />
        </button>
      )}
      {open && m.detail && (
        <div className="mc-ws__d">
          <Detail d={m.detail} />
        </div>
      )}
    </div>
  );
}

/* ---------- the pinned checklist ---------- */

const planIcon: Record<PlanItemState, ReactNode> = {
  done: <Icon name="check" className="i mc-pl__ok" />,
  run: <i className="mc-spin" aria-hidden="true" />,
  wait: <i className="mc-dot" aria-hidden="true" />,
  todo: <i className="mc-pl__todo" aria-hidden="true" />,
  failed: <Icon name="x" className="i mc-pl__bad" />,
};
const planWord: Record<PlanItemState, string> = { done: "Done", run: "Working", wait: "Waiting on you", todo: "Next", failed: "Failed" };

export function PlanStrip({ slug }: { slug: string }) {
  const plan = useDemo((s) => findConversation(s, slug)?.plan);
  const [open, setOpen] = useState(false);
  if (!plan?.items.length) return null;
  return <Strip plan={plan} open={open} setOpen={setOpen} />;
}

function Strip({ plan, open, setOpen }: { plan: WorkPlan; open: boolean; setOpen: (v: boolean) => void }) {
  const total = plan.items.length;
  const done = plan.items.filter((i) => i.state === "done").length;
  const cur = plan.items.find((i) => i.state === "wait" || i.state === "run" || i.state === "failed") ?? (done === total ? undefined : plan.items.find((i) => i.state === "todo"));
  const idx = cur ? plan.items.indexOf(cur) : total - 1;
  const state: PlanItemState = cur?.state ?? "done";
  return (
    <div className={cx("mc-pls", open && "is-open")}>
      <div className="mc-pls__in">
        {open && (
          <ol className="mc-pls__list" aria-label={plan.title}>
            {plan.items.map((it, i) => (
              <li key={it.label} className={cx("mc-pls__it", `is-${it.state}`)}>
                <span className="mc-pls__ic">{planIcon[it.state]}</span>
                <span className="mc-pls__n">{String(i + 1).padStart(2, "0")}</span>
                <span className="mc-pls__l">{it.label}</span>
                <span className="mc-pls__s">{planWord[it.state]}</span>
              </li>
            ))}
          </ol>
        )}
        <button type="button" className="mc-pls__bar" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="mc-pls__ic">{planIcon[state]}</span>
          <span className="mc-pls__now">
            {cur ? cur.label : `${plan.title} · done`}
          </span>
          <span className="mc-pls__meter" aria-hidden="true">
            {plan.items.map((it, i) => (
              <i key={i} className={`is-${it.state}`} />
            ))}
          </span>
          <span className="mc-pls__k">
            {Math.min(idx + 1, total)}/{total}
          </span>
          <Icon name="chevron-down" className="i mc-pls__c" />
        </button>
      </div>
    </div>
  );
}
