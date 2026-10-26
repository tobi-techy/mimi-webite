"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { shops } from "@/features/console/content/shops";
import { runningIn } from "@/features/console/demo/roster";
import { findConversation } from "@/features/console/demo/store";
import { helperNames, type Speaker } from "@/features/console/demo/types";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { consoleRoutes } from "@/features/console/config";
import { fileInvoice, sendMessage, sendPhoto, sendVoice, steerMessage } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";

/** Stagger (ms) for the live recording bars. */
const LIVE_BARS = Array.from({ length: 72 }, (_, i) => -((i * 211) % 900));
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type PlusItem = { icon: IconName; label: string; run: () => void };

type Worker = Exclude<Speaker, "me">;
type Skill = { cmd: string; text: string };
/** What `/` offers: that helper's skills only (Mimi offers a team-wide set). Each fills the composer. */
const SKILLS: Record<Worker, Skill[]> = {
  Mimi: [
    { cmd: "team", text: "What is everyone working on?" },
    { cmd: "chase", text: "Chase everyone over ₦50k this week" },
    { cmd: "check", text: "Check Joy's POS on GTBank" },
  ],
  Collector: [
    { cmd: "chase", text: "Chase everyone over ₦50k this week" },
    { cmd: "who-paid", text: "Who has paid so far?" },
    { cmd: "plan", text: "Show me the plan" },
    { cmd: "routine", text: "Do this every weekday morning" },
  ],
  Order: [
    { cmd: "order", text: "Mama Bisi wants 20 cartons" },
    { cmd: "route", text: "Plan Van 2's Saturday route" },
  ],
  Credit: [
    { cmd: "limit", text: "Should I raise Iya Femi's limit?" },
    { cmd: "review", text: "Review credit limits" },
  ],
  Stock: [
    { cmd: "restock", text: "Draft a restock from Dufil" },
    { cmd: "low", text: "Which shops are low?" },
  ],
  Brand: [
    { cmd: "report", text: "Draft the Hypo weekly report" },
    { cmd: "send", text: "Send it to Hypo" },
  ],
  Proof: [
    { cmd: "check", text: "Check Joy's POS on GTBank" },
    { cmd: "fake", text: "Is Kola Mart's alert fake?" },
  ],
};

/** `@` offers helpers and the shops this distributor may see (the demo shop list is all consented). */
type Mention = { label: string; kind: "helper" | "shop"; sub: string };
const MENTIONS: Mention[] = [
  ...(["Mimi", ...helperNames] as const).map((h) => ({ label: h, kind: "helper" as const, sub: "Helper" })),
  ...shops.map((s) => ({ label: s.name, kind: "shop" as const, sub: s.area })),
];

type Menu = { kind: "slash"; items: Skill[] } | { kind: "at"; items: Mention[]; from: number };

/** The `/` or `@` menu the text ends in, if any. */
function menuFor(value: string, helper: Worker): Menu | null {
  const slash = /^\/([\w-]*)$/.exec(value);
  if (slash) {
    const q = slash[1]!.toLowerCase();
    const items = SKILLS[helper].filter((s) => s.cmd.startsWith(q));
    return items.length ? { kind: "slash", items } : null;
  }
  const at = /(^|\s)@([^@\n]{0,24})$/.exec(value);
  if (at) {
    const q = at[2]!.toLowerCase();
    const items = MENTIONS.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 7);
    return items.length ? { kind: "at", items, from: value.length - at[2]!.length - 1 } : null;
  }
  return null;
}

/** The docked pill composer: + menu, text, mic (voice note) and send. */
export function Composer({ slug, helper }: { slug: string; helper: Worker }) {
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [rec, setRec] = useState(0);
  const draft = useDemo((s) => (s.draft?.slug === slug ? s.draft.text : null));
  const playing = useDemo((s) => s.playing);
  /* the helper is mid-run: what the owner sends now steers her at the next step */
  const running = useDemo((s) => {
    const c = findConversation(s, slug);
    return !!c && runningIn(s, c);
  });
  const [pick, setPick] = useState(0);
  const [shut, setShut] = useState<string | null>(null);
  const say = useToast();
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!menu) return;
    const off = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  /* voice note: counts up while recording, sends on second press */
  useEffect(() => {
    if (!rec) return;
    const t = window.setTimeout(() => setRec((r) => r + 1), 1000);
    return () => window.clearTimeout(t);
  }, [rec]);

  /* Escape cancels a recording */
  useEffect(() => {
    if (!rec) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setRec(0);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [rec]);

  const value = draft ?? text;
  const ac = useMemo(() => (draft === null && shut !== text ? menuFor(text, helper) : null), [text, draft, helper, shut]);
  const sel = ac ? Math.min(pick, ac.items.length - 1) : 0;

  function choose(i: number) {
    if (!ac) return;
    if (ac.kind === "slash") setText(ac.items[i]!.text);
    else setText(`${text.slice(0, ac.from)}@${ac.items[i]!.label} `);
    setPick(0);
    sfx("console", "select");
    input.current?.focus();
  }

  function cancelRec() {
    sfx("console", "close", { emphasis: "subtle" });
    setRec(0);
  }

  function send() {
    if (!value.trim() || playing) return;
    if (running) steerMessage(slug, value);
    else sendMessage(slug, value);
    setText("");
    input.current?.focus();
  }

  function mic() {
    if (rec) {
      sendVoice(slug, Math.max(2, rec));
      setRec(0);
    } else {
      sfx("console", "toggle");
      setRec(1);
    }
  }

  const items: PlusItem[] = [
    { icon: "camera", label: "Photo or book snap", run: () => sendPhoto(slug) },
    { icon: "bar-chart", label: "Poll", run: () => say("Helpers send polls when they need you to choose") },
    { icon: "mic", label: "Voice note", run: mic },
    { icon: "file-text", label: "Invoice", run: () => fileInvoice(slug) },
  ];

  return (
    <div className="mc-cmp" ref={wrap}>
      <button
        type="button"
        className={cx("mc-pl", menu && "is-on")}
        aria-label="Add"
        aria-expanded={menu}
        aria-haspopup="menu"
        onClick={() => {
          setMenu(!menu);
          sfx("console", menu ? "close" : "open", { emphasis: "subtle" });
        }}
      >
        <Icon name="plus" />
      </button>
      {menu && (
        <div className="mc-plus" role="menu" aria-label="Add to the thread">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(false);
                it.run();
              }}
            >
              <i>
                <Icon name={it.icon} />
              </i>
              {it.label}
            </button>
          ))}
          <Link role="menuitem" href={consoleRoutes.settings} onClick={() => setMenu(false)}>
            <i>
              <Icon name="settings" />
            </i>
            {helper} settings
          </Link>
        </div>
      )}
      {ac && (
        <div className="mc-plus mc-ac" role="listbox" id={`ac-${slug}`} aria-label={ac.kind === "slash" ? `${helper}'s skills` : "Mention a helper or shop"}>
          <p className="mc-ac__h">{ac.kind === "slash" ? `${helper}'s skills` : "Helpers and shops"}</p>
          {ac.kind === "slash"
            ? ac.items.map((s, i) => (
                <button
                  key={s.cmd}
                  type="button"
                  role="option"
                  aria-selected={i === sel}
                  className={cx(i === sel && "is-on")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                >
                  <span className="mc-ac__cmd">/{s.cmd}</span>
                  <span className="mc-ac__t">{s.text}</span>
                </button>
              ))
            : ac.items.map((m, i) => (
                <button
                  key={`${m.kind}-${m.label}`}
                  type="button"
                  role="option"
                  aria-selected={i === sel}
                  className={cx(i === sel && "is-on")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                >
                  {m.kind === "helper" ? (
                    <HelperFace name={m.label as Worker} size={18} />
                  ) : (
                    <Icon name="store" className="i mc-ac__ic" />
                  )}
                  <span className="mc-ac__t">{m.label}</span>
                  <span className="mc-ac__sub">{m.sub}</span>
                </button>
              ))}
        </div>
      )}
      {running && value.trim() && (
        <p className="mc-steer" role="status">
          Will steer at next step
        </p>
      )}
      <div className={cx("mc-pill", rec > 0 && "is-rec")}>
        {rec > 0 ? (
          <div className="mc-rec">
            <button type="button" className="mc-rec__x" aria-label="Cancel voice note" onClick={cancelRec}>
              <Icon name="x" />
            </button>
            <span className="mc-rec__t mc-mono" role="timer" aria-label={`Recording, ${rec - 1} seconds`}>
              {clock(rec - 1)}
            </span>
            <span className="mc-rec__w" aria-hidden="true">
              {LIVE_BARS.map((d, i) => (
                <i key={i} style={{ animationDelay: `${d}ms`, animationDuration: `${600 + ((i * 137) % 500)}ms` }} />
              ))}
            </span>
            <button type="button" className="mc-rec__s" aria-label="Send voice note" onClick={mic}>
              <Icon name="arrow-up" />
            </button>
          </div>
        ) : (
          <>
          <span className="mc-to" title={`Talking to ${helper}`} aria-hidden="true">
            <HelperFace name={helper} size={16} />
          </span>
          <textarea
            ref={input}
            rows={1}
            value={value}
            readOnly={draft !== null}
            aria-label={`Message ${helper}`}
            placeholder={`Message ${helper}`}
            aria-autocomplete="list"
            aria-controls={ac ? `ac-${slug}` : undefined}
            onChange={(e) => {
              setText(e.target.value);
              setShut(null);
              setPick(0);
            }}
            onKeyDown={(e) => {
              if (ac) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const n = ac.items.length;
                  setPick((sel + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
                  return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                  e.preventDefault();
                  choose(sel);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setShut(text);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />
          </>
        )}
        {rec === 0 && (
          <>
            <button type="button" className="mc-mic" aria-label="Record a voice note" onClick={mic}>
              <Icon name="mic" />
            </button>
            <button type="button" className="mc-snd" aria-label="Send" disabled={!value.trim()} onClick={send}>
              <Icon name="arrow-up" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
