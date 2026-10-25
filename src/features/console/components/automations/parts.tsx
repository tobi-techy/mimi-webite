"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { channelName, type Channel } from "@/features/console/content/automations";
import type { HelperName } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

/** Shared pieces of the Automations flow: crumbs, channel icons, the trigger → helper → result diagram, the welcome tour. */

export const autoRoutes = {
  list: "/console/automations",
  templates: "/console/automations/templates",
  newFrom: (template?: string) => `/console/automations/new${template ? `?template=${template}` : ""}`,
  detail: (id: string, created?: boolean) => (created ? `/console/automations/view?id=${id}` : `/console/automations/${id}`),
};

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="x-acr" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={it.label}>
            {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
            {i < items.length - 1 && <Icon name="chevron-right" className="i x-acr__s" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

const channelIcon: Record<Channel, IconName> = { whatsapp: "whatsapp", bank: "landmark", email: "mail", sheet: "sheet" };

export function ChannelIcon({ c, size = "sm" }: { c: Channel; size?: "sm" | "md" }) {
  return (
    <span className={cx("x-ach", `x-ach--${c}`, size === "md" && "x-ach--md")} title={channelName[c]}>
      <Icon name={channelIcon[c]} />
      <span className="sr-only">{channelName[c]}</span>
    </span>
  );
}

/** [EVERY MONDAY 8AM] → [COLLECTOR] → [WHATSAPP TO OWNER], with the dashed "again" loop. */
export function AutoDiagram({
  trigger,
  helper,
  result,
  middle,
  captions = ["trigger fires", "does the work", "result lands"],
  loop = "again, every time it triggers",
  lead = "refresh-cw",
}: {
  trigger: string;
  helper?: HelperName;
  result: string;
  middle?: string;
  captions?: [string, string, string];
  loop?: string | null;
  lead?: IconName;
}) {
  return (
    <div className="x-adg" aria-label={`${trigger}, then ${middle ?? helper}, then ${result}`} role="img">
      {loop && (
        <div className="x-adg__loop" aria-hidden="true">
          <span>{loop}</span>
        </div>
      )}
      <div className="x-adg__row" aria-hidden="true">
        <div className="x-adg__col">
          <span className="x-adg__box">
            <Icon name={lead} />
            {trigger}
          </span>
          <small>{captions[0]}</small>
        </div>
        <i className="x-adg__line" />
        <div className="x-adg__col">
          <span className="x-adg__box x-adg__box--on">
            {helper ? <HelperFace name={helper} size={14} /> : <Icon name="sparkles" />}
            {middle ?? helper}
          </span>
          <small>{captions[1]}</small>
        </div>
        <i className="x-adg__line" />
        <div className="x-adg__col">
          <span className="x-adg__box">
            <Icon name="message-square" />
            {result}
          </span>
          <small>{captions[2]}</small>
        </div>
      </div>
    </div>
  );
}

/* ---------- welcome tour: shows once, reopenable from "How automations work" ---------- */

const WELCOME_KEY = "mimi-auto-welcome";
const OPEN_EVENT = "mimi-auto-welcome-open";
export const openWelcome = () => window.dispatchEvent(new Event(OPEN_EVENT));

const SLIDES: { title: string; body: ReactNode; diagram: ReactNode }[] = [
  {
    title: "Put a helper to work on a trigger",
    body: (
      <>
        An <b>automation</b> is a job plus a trigger. Each time the trigger fires, a helper opens a fresh thread, checks your bank, book and
        WhatsApp, does the work, and sends the result where you already look.
      </>
    ),
    diagram: <AutoDiagram trigger="EVERY MONDAY 8AM" helper="Collector" result="WHATSAPP TO OWNER" captions={["trigger fires", "chases what's owed", "result lands"]} />,
  },
  {
    title: "Mimi proposes, code checks, you approve",
    body: (
      <>
        Helpers draft. Rules in code check every draft: no money moves, no shop that already paid gets chased, quiet hours hold. Anything that
        would reach a shop waits for <b>your yes</b>.
      </>
    ),
    diagram: (
      <AutoDiagram
        trigger="HELPER DRAFTS"
        lead="pen"
        middle="CODE CHECKS"
        result="YOU APPROVE"
        captions={["a plan or message", "money never moves", "then it sends"]}
        loop={null}
      />
    ),
  },
  {
    title: "Start from a template",
    body: (
      <>
        Pick a use case like <b>Monday debt chase</b> or <b>Check every transfer alert</b>. Name, trigger, shops and instructions come filled in.
        Change anything, then turn it on. Every run shows its reasoning and steps in the thread.
      </>
    ),
    diagram: <AutoDiagram trigger="BANK ALERT LANDS" lead="landmark" helper="Proof" result="CONSOLE THREAD" captions={["an event fires", "checks it's real", "verdict lands"]} />,
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    const t = window.setTimeout(() => !seen && setOpen(true), 250);
    const onOpen = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  });
  function close() {
    setOpen(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* storage blocked */
    }
  }
  if (!open) return null;
  const s = SLIDES[i]!;
  const last = i === SLIDES.length - 1;
  return (
    <div className="x-awm" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="x-awm__card" role="dialog" aria-modal="true" aria-labelledby="awm-t">
        <div className="x-awm__fig">{s.diagram}</div>
        <div className="x-awm__body">
          <p className="x-awm__eye">
            Automations · Welcome · {i + 1} of {SLIDES.length}
          </p>
          <h2 id="awm-t">{s.title}</h2>
          <p className="x-awm__p">{s.body}</p>
          <button type="button" className="x-awm__x" aria-label="Close" onClick={close}>
            <Icon name="x" />
          </button>
          <div className="x-awm__ft">
            <span className="x-awm__dots" aria-hidden="true">
              {SLIDES.map((_, k) => (
                <i key={k} className={cx(k === i && "is-on")} />
              ))}
            </span>
            {!last && (
              <button type="button" className="x-abtn x-abtn--ghost" onClick={close}>
                Skip
              </button>
            )}
            {i > 0 && (
              <button type="button" className="x-abtn" onClick={() => setI(i - 1)}>
                Back
              </button>
            )}
            <button type="button" className="x-abtn x-abtn--or" autoFocus onClick={() => (last ? close() : setI(i + 1))}>
              {last ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
