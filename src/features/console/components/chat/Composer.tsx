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
import { MAX_RECORD_S, pickRecorderMime, type AttachPurpose } from "@/features/console/api/attachments";
import { isApiThread, liveAttach } from "@/features/console/api/actions";
import { useLive } from "@/features/console/api/live-store";
import { useDemo } from "@/features/console/demo/store";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";
import { consoleMotion } from "@/config/console-motion";
import { STEER_EVENT } from "@/features/console/lib/thread-view";

/** Stagger (ms) for the live recording bars. */
const LIVE_BARS = Array.from({ length: 72 }, (_, i) => -((i * 211) % 900));
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

type PlusItem = { icon: IconName; label: string; key: "photo" | "poll" | "voice" | "invoice" };

/** A real recording in an API thread (MediaRecorder): its stream, chunks and type. */
type Recording = { mr: MediaRecorder; stream: MediaStream; chunks: Blob[]; mime: string; keep: boolean };
const canRecord = () =>
  typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
const ACCEPT: Record<AttachPurpose, string> = {
  photo: "image/jpeg,image/png,image/webp",
  voice: "audio/ogg,audio/webm,audio/mp4,audio/x-m4a,audio/mpeg,audio/wav,.ogg,.opus,.webm,.m4a,.mp3,.wav",
  invoice: "application/pdf,image/jpeg,image/png,image/webp,.pdf",
};

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

/**
 * The live demo's `/` list: every owner message goes to Mimi there, and the shops are the demo
 * copy's (not the sample ones above), so the asks name no sample shop.
 */
const LIVE_SKILLS: Skill[] = [
  { cmd: "owes", text: "Who owes me the most this week?" },
  { cmd: "chase", text: "Chase everyone over ₦50k this week" },
  { cmd: "low", text: "Which shops are running low?" },
  { cmd: "credit", text: "Which shops are close to their credit limit?" },
];

/** `@` offers helpers and the shops this distributor may see (the demo shop list is all consented). */
type Mention = { label: string; kind: "helper" | "shop"; sub: string };
const HELPER_MENTIONS: Mention[] = (["Mimi", ...helperNames] as const).map((h) => ({ label: h, kind: "helper" as const, sub: "Helper" }));
const MENTIONS: Mention[] = [...HELPER_MENTIONS, ...shops.map((s) => ({ label: s.name, kind: "shop" as const, sub: s.area }))];

type Menu = { kind: "slash"; items: Skill[] } | { kind: "at"; items: Mention[]; from: number };

/** The `/` or `@` menu the text ends in, if any. `live`: the demo copy's skills and shops. */
function menuFor(value: string, helper: Worker, live: { shops: readonly { name: string; area: string }[] } | null): Menu | null {
  const slash = /^\/([\w-]*)$/.exec(value);
  if (slash) {
    const q = slash[1]!.toLowerCase();
    const items = (live ? LIVE_SKILLS : SKILLS[helper]).filter((s) => s.cmd.startsWith(q));
    return items.length ? { kind: "slash", items } : null;
  }
  const at = /(^|\s)@([^@\n]{0,24})$/.exec(value);
  if (at) {
    const q = at[2]!.toLowerCase();
    const pool = live ? [...HELPER_MENTIONS, ...live.shops.map((s) => ({ label: s.name, kind: "shop" as const, sub: s.area }))] : MENTIONS;
    const items = pool.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 7);
    return items.length ? { kind: "at", items, from: value.length - at[2]!.length - 1 } : null;
  }
  return null;
}

/** A small squish on the send button (also when you send with Enter). Transform only; off for reduced motion. */
function squish(el: HTMLElement | null) {
  if (!el || !consoleMotion.sendSquish || typeof el.animate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(0.86)", offset: 0.3 },
      { transform: "scale(1.06)", offset: 0.62 },
      { transform: "scale(0.99)", offset: 0.84 },
      { transform: "scale(1)" },
    ],
    { duration: 340, easing: "cubic-bezier(.3,.7,.4,1)" },
  );
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
  /* "Steer" from the Steps sheet: the next message goes to the running task */
  const [steering, setSteering] = useState<string | null>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ slug: string; task: string }>).detail;
      if (d?.slug !== slug) return;
      setSteering(d.task);
      window.setTimeout(() => input.current?.focus(), 0);
    };
    window.addEventListener(STEER_EVENT, on);
    return () => window.removeEventListener(STEER_EVENT, on);
  }, [slug]);
  const [shut, setShut] = useState<string | null>(null);
  const say = useToast();
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const sendBtn = useRef<HTMLButtonElement>(null);
  const pickers = useRef<Partial<Record<AttachPurpose, HTMLInputElement | null>>>({});
  const recording = useRef<Recording | null>(null);
  /* demo build, API thread: photos, voice notes and invoices go to Mimi for real */
  const live = isApiThread(slug);

  /* a recording never outlives the composer */
  useEffect(
    () => () => {
      const r = recording.current;
      if (r) {
        r.keep = false;
        if (r.mr.state !== "inactive") r.mr.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  function attach(file: Blob & { name?: string }, purpose: AttachPurpose, seconds?: number) {
    void liveAttach(slug, file, purpose, { seconds }).then((err) => err && say(err));
  }

  function openPicker(purpose: AttachPurpose) {
    pickers.current[purpose]?.click();
  }

  async function startRecording() {
    if (!canRecord()) return openPicker("voice");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickRecorderMime((t) => MediaRecorder.isTypeSupported(t));
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const r: Recording = { mr, stream, chunks: [], mime: mr.mimeType || mime || "audio/webm", keep: false };
      mr.ondataavailable = (e) => e.data.size && r.chunks.push(e.data);
      recording.current = r;
      mr.start(250);
      sfx("console", "toggle");
      setRec(1);
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      say(denied ? "The browser blocked the microphone. Allow it, or attach a voice note file." : "Couldn't start the microphone. You can attach a voice note file instead.");
    }
  }

  /** Stops the recording; sends it when `send`, else throws it away. */
  function stopRecording(send: boolean, seconds: number) {
    const r = recording.current;
    recording.current = null;
    if (!r) return;
    r.keep = send;
    r.mr.onstop = () => {
      r.stream.getTracks().forEach((t) => t.stop());
      if (!r.keep) return;
      const blob = new Blob(r.chunks, { type: r.mime });
      attach(blob, "voice", seconds);
    };
    if (r.mr.state !== "inactive") r.mr.stop();
    else r.mr.onstop(new Event("stop"));
  }

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

  /* voice note: counts up while recording, sends on second press (and at five minutes) */
  useEffect(() => {
    if (!rec) return;
    const t = window.setTimeout(() => {
      /* a real recording stops and sends itself at five minutes */
      if (live && rec >= MAX_RECORD_S) {
        stopRecording(true, rec);
        setRec(0);
      } else setRec((r) => r + 1);
    }, 1000);
    return () => window.clearTimeout(t);
    // stopRecording reads refs only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec, live]);

  /* Escape cancels a recording */
  useEffect(() => {
    if (!rec) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      stopRecording(false, 0);
      setRec(0);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec]);

  const value = draft ?? text;
  const liveShops = useLive((s) => s.shops);
  const ac = useMemo(
    () => (draft === null && shut !== text ? menuFor(text, helper, live ? { shops: liveShops ?? [] } : null) : null),
    [text, draft, helper, shut, live, liveShops],
  );
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
    stopRecording(false, 0);
    setRec(0);
  }

  function send() {
    if (!value.trim() || playing) return;
    squish(sendBtn.current);
    if (running) steerMessage(slug, value);
    else sendMessage(slug, value);
    setSteering(null);
    setText("");
    input.current?.focus();
  }

  function mic() {
    if (live) {
      if (rec) {
        stopRecording(true, Math.max(1, rec - 1));
        setRec(0);
      } else void startRecording();
      return;
    }
    if (rec) {
      sendVoice(slug, Math.max(2, rec));
      setRec(0);
    } else {
      sfx("console", "toggle");
      setRec(1);
    }
  }

  const items: PlusItem[] = [
    { icon: "camera", label: "Photo or book snap", key: "photo" },
    { icon: "bar-chart", label: "Poll", key: "poll" },
    { icon: "mic", label: "Voice note", key: "voice" },
    { icon: "file-text", label: "Invoice", key: "invoice" },
  ];
  /* runs on a tap (the pickers and the recorder are refs, read only in handlers) */
  function runItem(key: PlusItem["key"]) {
    if (key === "photo") return live ? openPicker("photo") : sendPhoto(slug);
    if (key === "poll") return say("Helpers send polls when they need you to choose");
    if (key === "voice") return mic();
    return live ? openPicker("invoice") : fileInvoice(slug);
  }

  return (
    <div className="mc-cmp" ref={wrap}>
      {live &&
        (Object.keys(ACCEPT) as AttachPurpose[]).map((p) => (
          <input
            key={p}
            ref={(el) => {
              pickers.current[p] = el;
            }}
            type="file"
            accept={ACCEPT[p]}
            hidden
            tabIndex={-1}
            aria-hidden="true"
            data-pick={p}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) attach(f, p);
            }}
          />
        ))}
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
                runItem(it.key);
              }}
            >
              <i>
                <Icon name={it.icon} />
              </i>
              {it.label}
            </button>
          ))}
          <Link role="menuitem" href={consoleRoutes.newThread} onClick={() => setMenu(false)}>
            <i>
              <Icon name="plus" />
            </i>
            New task (fresh context)
          </Link>
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
      {steering ? (
        <p className="mc-steer mc-steer--on" role="status">
          <span>Steering: {steering}</span>
          <button type="button" className="mc-steer__x" onClick={() => setSteering(null)}>
            Cancel
          </button>
        </p>
      ) : (
        running &&
        value.trim() && (
          <p className="mc-steer" role="status">
            Queued · after current task
          </p>
        )
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
            <button ref={sendBtn} type="button" className="mc-snd" aria-label="Send" disabled={!value.trim()} onClick={send}>
              <Icon name="arrow-up" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
