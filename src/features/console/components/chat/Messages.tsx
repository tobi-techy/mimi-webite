"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { consoleMotion } from "@/config/console-motion";
import { ReactTarget, ReactionLayer, type LayerState } from "@/features/console/components/chat/Tapbacks";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Markdown } from "@/features/console/components/panel/Markdown";
import { StepLine, ThoughtBlock } from "@/features/console/components/chat/Work";
import { Answer } from "@/features/console/components/chat/answer/Answer";
import { Inline, plainInline } from "@/features/console/components/chat/answer/Inline";
import { Icon } from "@/features/console/components/ui/Icon";
import { MimiLooking } from "@/components/ui/MimiLooking";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { useDemo } from "@/features/console/demo/store";
import {
  approveCard,
  declineCard,
  openDoc,
  openPanel,
  openSheet,
  toggleFan,
  votePoll,
} from "@/features/console/demo/engine";
import { cardActions, tierOf } from "@/features/console/demo/needs";
import { reactableKinds, type ProofLevel, type DecisionCard, type Message, type ReactableMessage, type Speaker, type Verdict } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fresh check without a hook (event lines are rendered inline in the feed loop). */
const isFreshAt = (at: number) => typeof window !== "undefined" && Date.now() - at < 1600 && consoleMotion.messageIn;

/** True when this message was created moments ago (so it animates in). Client-only. */
function useFresh(at: number | undefined): boolean {
  const [fresh] = useState(() => at === -1 || (typeof window !== "undefined" && !!at && Date.now() - at < 1600));
  return fresh;
}

/** `**bold**` and `==orange==` in demo copy. Unclosed markers (mid-stream) are dropped. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|==(.+?)==/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index).replace(/\*\*|==/g, ""));
    parts.push(m[1] ? <b key={k++}>{m[1]}</b> : <span key={k++} className="mc-or">{m[2]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last).replace(/\*\*|==/g, ""));
  return <>{parts}</>;
}

/** Drops markers left open mid-stream so half-revealed `**bold**`, `==edit==` or `code` never show raw. */
function closeOpenMarks(text: string): string {
  let t = text;
  for (const mark of ["**", "==", "`"]) {
    const parts = t.split(mark);
    if (parts.length % 2 === 0) {
      const last = t.lastIndexOf(mark);
      t = t.slice(0, last) + t.slice(last + mark.length);
    }
  }
  return t;
}

/** Reveals a fresh helper message word by word, rendered as Factory-style markdown (no bubble). */
function Streamed({ text, fresh }: { text: string; fresh: boolean }) {
  const words = text.split(" ");
  const animate = fresh && consoleMotion.streamText && !prefersReducedMotion();
  const [n, setN] = useState(animate ? 1 : words.length);
  useEffect(() => {
    if (n >= words.length) return;
    const t = window.setTimeout(() => setN((x) => x + 1), 34);
    return () => window.clearTimeout(t);
  }, [n, words.length]);
  const shown = n >= words.length ? text : closeOpenMarks(words.slice(0, n).join(" "));
  return <Markdown text={shown} className="mc-md--msg" />;
}

const verdictLabel: Record<Verdict, string> = { verified: "Verified", self: "Self-reported", fake: "Fake alert" };
export function VerdictTag({ v, children }: { v: Verdict; children?: ReactNode }) {
  return <span className={cx("mc-vf", `mc-vf--${v}`)}>{children ?? verdictLabel[v]}</span>;
}

/* ---------- message kinds ---------- */

type Ctx = { slug: string };

/** Your messages: an iMessage-style bubble. Helper messages: markdown text flowing in the column. */
function Bubble({ m, tail }: { m: Extract<Message, { kind: "text" }>; tail: boolean }) {
  const fresh = useFresh(m.at);
  if (m.from !== "me") return <Streamed text={m.text} fresh={fresh} />;
  return (
    <div className={cx("mc-b", tail && "mc-b--tail")}>
      <Inline text={m.text} />
    </div>
  );
}

function ProofCard({ m }: { m: Extract<Message, { kind: "proof" }> }) {
  return (
    <div className={cx("mc-pv", m.verdict === "fake" && "mc-pv--fake")}>
      <div className="mc-pv__top">
        <b>{m.title}</b>
        <span className="mc-mono">{m.meta}</span>
        <div className="mc-pv__amt">{naira(m.amount)}</div>
        <span className="mc-pv__stamp">{m.stamp}</span>
      </div>
      <div className="mc-pv__bot">
        <div>
          <b>{m.foot}</b>
          {m.footSub}
        </div>
        <VerdictTag v={m.verdict} />
      </div>
    </div>
  );
}

const FAN_CLOSED = [
  [12, 6, 5],
  [6, 3, 2],
  [0, 0, -2],
];
const FAN_OPEN = [
  [72, 14, 10],
  [36, 6, 4],
  [0, 0, -4],
];

function PhotoFan({ m, ctx }: { m: Extract<Message, { kind: "photos" }>; ctx: Ctx }) {
  const open = !!m.open;
  const pos = open && consoleMotion.photoFan ? FAN_OPEN : FAN_CLOSED;
  const shown = m.photos.slice(0, 3);
  return (
    <div className="mc-fanwrap">
      <button
        type="button"
        className={cx("mc-fan", open && "is-open", shown.length === 1 && "mc-fan--one")}
        aria-expanded={open}
        aria-label={`${m.label}. ${open ? "Close" : "Open"} the photos`}
        onClick={() => toggleFan(ctx.slug, m.id)}
      >
        {shown.map((src, i) => {
          const [x, y, r] = pos[i + (3 - shown.length)] ?? [0, 0, 0];
          return <img key={src} src={src} alt="" style={{ left: x, top: y, transform: `rotate(${r}deg)`, zIndex: i }} />;
        })}
      </button>
      <span className="mc-fanl">
        <Icon name="image" />
        {m.label}
      </span>
    </div>
  );
}

function Poll({ m, ctx }: { m: Extract<Message, { kind: "poll" }>; ctx: Ctx }) {
  return (
    <fieldset className="mc-poll">
      <legend className="mc-poll__q">{m.question}</legend>
      <small className="mc-mono">Poll · you decide</small>
      {m.options.map((o, i) => (
        <button
          key={o}
          type="button"
          className={cx("mc-op", m.voted === i && "is-on")}
          aria-pressed={m.voted === i}
          onClick={() => votePoll(ctx.slug, m.id, i)}
        >
          <i className="mc-op__fill" style={{ width: m.voted === i ? "100%" : 0 }} />
          <span>{o}</span>
          {m.voted === i && <span aria-hidden="true">✓</span>}
        </button>
      ))}
    </fieldset>
  );
}

const VOICE_BARS = 27;
/** m:ss for a voice note length. */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
/** A stable, speech-like waveform (bar heights in %) seeded by the message id. */
function waveOf(seed: string, n: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const raw: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    raw.push((h % 1000) / 1000);
  }
  /* light smoothing so it reads like speech, tapered at both ends */
  const out = raw.map((r, i) => {
    const s = (r * 2 + (raw[i - 1] ?? r) + (raw[i + 1] ?? r)) / 4;
    const env = Math.sin((Math.PI * (i + 1)) / (n + 1)) * 0.5 + 0.5;
    return Math.round(Math.max(18, Math.min(100, (0.3 + s * 0.85) * env * 100)));
  });
  return out;
}

function VoiceNote({ m }: { m: Extract<Message, { kind: "voice" }> }) {
  const me = m.from === "me";
  const [playing, setPlaying] = useState(false);
  const [p, setP] = useState(0);
  const [open, setOpen] = useState(false);
  const at = useRef(0);
  const bars = useMemo(() => waveOf(m.id, VOICE_BARS), [m.id]);

  /* simulated playback: rAF progress over the stated duration, resumes where it paused */
  useEffect(() => {
    if (!playing) return;
    const dur = m.seconds * 1000;
    const start = performance.now() - at.current * dur;
    let raf = 0;
    const tick = (now: number) => {
      const x = (now - start) / dur;
      if (x >= 1) {
        at.current = 0;
        setP(0);
        setPlaying(false);
        return;
      }
      at.current = x;
      setP(x);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, m.seconds]);

  const started = playing || p > 0;
  const left = started ? Math.max(0, Math.ceil(m.seconds * (1 - p))) : m.seconds;
  const toggle = () => setPlaying((x) => !x);
  return (
    <div className={cx("mc-vn", me && "mc-vn--me")}>
      <div className={cx("mc-vn__b", playing && "is-play")}>
        <button
          type="button"
          className="mc-vn__p"
          aria-label={`${playing ? "Pause" : "Play"} voice note, ${clock(m.seconds)}`}
          aria-pressed={playing}
          onClick={toggle}
        >
          <Icon name={playing ? "pause" : "play"} />
        </button>
        <span className="mc-vn__w" aria-hidden="true" onClick={toggle}>
          {bars.map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} className={cx((i + 0.5) / bars.length <= p && "is-on")} />
          ))}
        </span>
        <span className="mc-vn__t mc-mono" aria-hidden="true">
          {clock(left)}
        </span>
      </div>
      {m.transcript && (
        <div className="mc-vn__tr">
          <button type="button" className="mc-vn__tg" aria-expanded={open} onClick={() => setOpen(!open)}>
            Transcript
            <Icon name="chevron-right" />
          </button>
          {open && <p>{m.transcript}</p>}
        </div>
      )}
    </div>
  );
}

export const cardIcon: Record<DecisionCard["kind"], IconName> = {
  plan: "file-text",
  order: "package",
  credit: "landmark",
  stock: "bar-chart",
  brand: "share",
  flag: "triangle-alert",
  match: "shield-check",
};

const proofWord: Record<ProofLevel, string> = { verified: "verified", likely: "likely", estimated: "estimated" };

function CardView({ m, ctx }: { m: Extract<Message, { kind: "card" }>; ctx: Ctx }) {
  const c: DecisionCard = m.card;
  const fresh = useFresh(m.at);
  const plan = c.kind === "plan";
  const live = c.rows.filter((r) => r.tone !== "Skip");
  const rows = plan ? live.slice(0, 2) : c.rows;
  const more = plan ? live.length - rows.length : 0;
  const icon = cardIcon[c.kind];
  const act = cardActions(c);
  const tier = tierOf(c);
  return (
    <div className={cx("mc-apc", c.status === "needs" && fresh && consoleMotion.approvalAttention && "is-attn")}>
      <div className="mc-apc__h">
        <Icon name={icon} />
        <div className="mc-apc__t">
          {c.title}
          <small className="mc-mono">{c.sub}</small>
        </div>
        <span className={cx("mc-tier", `mc-tier--${tier.toLowerCase()}`)} title={`Risk tier: ${tier}`}>
          {tier}
        </span>
        {c.status === "needs" && <span className="mc-nd">Needs you</span>}
        {c.status === "sending" && <span className="mc-nd mc-nd--run">Sending</span>}
        {c.status === "sent" && <span className="mc-nd mc-nd--ok">{plan || c.kind === "brand" ? "Sent" : "Done"}</span>}
        {c.status === "declined" && <span className="mc-nd mc-nd--off">Discarded</span>}
      </div>
      {c.email && (
        <div className="mc-apc__mail">
          <p>
            <span>To</span>
            {c.email.to}
          </p>
          <p>
            <span>Subject</span>
            {c.email.subject}
          </p>
          <p className="mc-apc__body">{c.email.body}</p>
        </div>
      )}
      <div className="mc-apc__rows">
        {rows.map((r) => (
          <div key={r.label} className="mc-apc__rw">
            <span>{r.label}</span>
            <span>
              {r.amount !== undefined && naira(r.amount)}
              {r.amount !== undefined && (r.tone || r.note) && " · "}
              {r.tone ?? r.note}
              {r.proof && <em className={cx("mc-prf", `mc-prf--${r.proof}`)}>{proofWord[r.proof]}</em>}
              {r.flag && <em className="mc-or"> · {r.flag}</em>}
            </span>
          </div>
        ))}
        {more > 0 && (
          <div className="mc-apc__rw">
            <span>+{more} more</span>
            <span />
          </div>
        )}
      </div>
      {c.status === "needs" && (
        <div className="mc-apc__ft">
          <button
            type="button"
            className="mc-btn"
            onClick={() => (act.secondary === "Review" ? openSheet(ctx.slug, m.id) : declineCard(ctx.slug, m.id))}
          >
            {act.secondary}
          </button>
          <button type="button" className="mc-btn mc-btn--pri" onClick={() => approveCard(ctx.slug, m.id)}>
            {act.primary}
          </button>
        </div>
      )}
      {c.status === "sending" && (
        <div className="mc-apc__done mc-mono">
          <i className="mc-spin" aria-hidden="true" />
          {plan ? "Sending on WhatsApp" : "Saving"}
        </div>
      )}
      {c.status === "sent" && (
        <div className="mc-apc__done mc-apc__done--ok mc-mono" role="status">
          ✓ {c.doneText} · {c.sentAt}
        </div>
      )}
    </div>
  );
}

function DocChip({ m }: { m: Extract<Message, { kind: "doc" }> }) {
  return (
    <button type="button" className="mc-chipcard" onClick={() => openDoc(m.docId)}>
      <span className="mc-chipcard__i">
        <Icon name="file-text" />
      </span>
      <span>
        {m.title}
        <small className="mc-mono">{m.sub}</small>
      </span>
      <Icon name="chevron-right" />
    </button>
  );
}

function ComputerChip({ m }: { m: Extract<Message, { kind: "computer" }> }) {
  return (
    <button type="button" className="mc-chipcard" onClick={() => openPanel("Computer")}>
      <span className="mc-chipcard__i">
        <Icon name="monitor" />
      </span>
      <span>
        {m.title}
        <small className="mc-mono">{m.sub}</small>
      </span>
      <Icon name="chevron-right" />
    </button>
  );
}

/* ---------- the feed ---------- */

const speakerOf = (m: Message): Speaker | null => ("from" in m ? m.from : null);
const isReactable = (m: Message): m is ReactableMessage => (reactableKinds as readonly string[]).includes(m.kind);

function bodyOf(m: Message, ctx: Ctx, tail: boolean): ReactNode {
  if (m.kind === "text") return <Bubble m={m} tail={tail} />;
  if (m.kind === "proof") return <ProofCard m={m} />;
  if (m.kind === "photos") return <PhotoFan m={m} ctx={ctx} />;
  if (m.kind === "poll") return <Poll m={m} ctx={ctx} />;
  if (m.kind === "voice") return <VoiceNote m={m} />;
  if (m.kind === "card") return <CardView m={m} ctx={ctx} />;
  if (m.kind === "doc") return <DocChip m={m} />;
  if (m.kind === "computer") return <ComputerChip m={m} />;
  if (m.kind === "answer") return <Answer m={m} />;
  return null;
}

/** What Copy puts on the clipboard, and how a message is named to screen readers. */
function plainOf(m: ReactableMessage): string {
  const strip = plainInline;
  if (m.kind === "text") return strip(m.text);
  if (m.kind === "proof") return `${m.title} · ${m.meta} · ${naira(m.amount)} · ${m.foot}`;
  if (m.kind === "photos") return m.label;
  if (m.kind === "poll") return `${m.question} ${m.options.join(" / ")}`;
  if (m.kind === "voice") return m.caption;
  return `${m.card.title} · ${m.card.sub}`;
}
const kindName: Record<ReactableMessage["kind"], string> = {
  text: "Message",
  proof: "Payment proof",
  photos: "Photos",
  poll: "Poll",
  voice: "Voice note",
  card: "Card",
};

const boxOf = (el: HTMLElement) => {
  const b = el.getBoundingClientRect();
  return { top: b.top, left: b.left, width: b.width, height: b.height };
};

export function MessageFeed({ slug, messages, typing }: { slug: string; messages: Message[]; typing: Speaker | null }) {
  const ctx = { slug };
  const [layer, setLayer] = useState<LayerState | null>(null);
  const close = useCallback(() => {
    setLayer((cur) => {
      if (cur?.origin) window.setTimeout(() => cur.origin?.focus({ preventScroll: true }), 0);
      return null;
    });
  }, []);
  const items: ReactNode[] = [];
  /** The last speaker before index i; activity lines belong to the turn around them. */
  const speakerBefore = (i: number): Speaker | null => {
    for (let j = i - 1; j >= 0; j--) {
      const x = messages[j]!;
      if (x.kind === "date") return null;
      const s = speakerOf(x);
      if (s) return s;
    }
    return null;
  };
  messages.forEach((m, i) => {
    const who = speakerOf(m);
    const prev = speakerBefore(i);
    const next = i < messages.length - 1 ? speakerOf(messages[i + 1]!) : typing;
    if (m.kind === "date") {
      items.push(<DateLine key={m.id} label={m.label} />);
      return;
    }
    if (m.kind === "event") {
      items.push(
        <p key={m.id} className={cx("mc-ev", isFreshAt(m.at) && "mc-in")} role="note">
          {m.text}
        </p>,
      );
      return;
    }
    if (m.kind === "system") {
      items.push(
        <Row key={m.id} at={m.at} kind="system" turn={prev === "me"}>
          <p className="mc-act">
            <Icon name={m.icon ?? "check"} />
            <span>
              <RichText text={m.text} />
            </span>
          </p>
        </Row>,
      );
      return;
    }
    if (m.kind === "thought" || m.kind === "step") {
      items.push(
        <Row key={m.id} id={m.id} at={m.at} kind="work" who={m.from} showName={m.from !== prev} turn={m.from !== prev}>
          {m.kind === "thought" ? <ThoughtBlock m={m} /> : <StepLine m={m} />}
        </Row>,
      );
      return;
    }
    if (!who) return;
    const me = who === "me";
    const showName = !me && who !== prev;
    const tail = who !== next;
    let body = bodyOf(m, ctx, tail);
    if (isReactable(m)) {
      const open = (mode: LayerState["mode"]) => (el: HTMLElement) => {
        setLayer({ id: m.id, mode, rect: boxOf(el), me, origin: (el.closest(".mc-rx") as HTMLElement | null) ?? el });
      };
      body = (
        <ReactTarget
          kind={m.kind}
          side={me ? "right" : "left"}
          label={`${kindName[m.kind]} from ${me ? "you" : who}: ${plainOf(m).slice(0, 80)}`}
          lifted={layer?.mode === "bar" && layer.id === m.id}
          reactions={m.reactions}
          onOpen={open("bar")}
          onWho={open("who")}
        >
          {body}
        </ReactTarget>
      );
    }
    items.push(
      <Row
        key={m.id}
        id={m.id}
        at={m.at}
        kind={me ? "me" : "them"}
        who={who}
        showName={showName}
        turn={who !== prev}
        tail={tail}
        reacted={isReactable(m) && !!m.reactions?.length}
        wide={m.kind === "answer"}
      >
        {body}
      </Row>,
    );
    if (me && m.kind === "text" && m.read && (i === messages.length - 1 || speakerOf(messages[i + 1]!) !== "me"))
      items.push(
        <p key={`${m.id}-rd`} className="mc-rd mc-mono">
          Read
        </p>,
      );
  });
  if (typing && typing !== "me") {
    const prev = speakerBefore(messages.length);
    items.push(
      <Row key="typing" at={-1} kind="work" who={typing} showName={typing !== prev} turn={typing !== prev} tail>
        <Working who={typing} slug={slug} />
      </Row>,
    );
  }
  const target = layer ? messages.find((x) => x.id === layer.id) : undefined;
  if (layer && target && isReactable(target)) {
    const who = target.from;
    const at = messages.indexOf(target);
    const after = at < messages.length - 1 ? speakerOf(messages[at + 1]!) : typing;
    items.push(
      <ReactionLayer
        key="rx-layer"
        slug={slug}
        state={layer}
        reactions={target.reactions ?? []}
        copyText={plainOf(target)}
        speaker={who === "me" ? "You" : who}
        onClose={close}
        copy={
          <div className={cx("mc-rx", `mc-rx--${target.kind}`, !!target.reactions?.length && "has-rx")}>{bodyOf(target, ctx, who !== after)}</div>
        }
      />,
    );
  }
  return <>{items}</>;
}

/**
 * While a helper works: a live work-step line instead of a loader ("Reply → writing · 0.8s"),
 * the same grey tool → result · time shape as finished steps. No dots, no "is working".
 */
function Working({ who, slug }: { who: Exclude<Speaker, "me">; slug: string }) {
  const status = useDemo((s) => s.conversations.find((c) => c.slug === slug)?.status ?? "");
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(t0);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, []);
  const doing = !status || status === "typing" ? "writing the reply" : status;
  return (
    <div className="mc-ws mc-ws--tool is-run mc-ws--live" role="status" aria-live="polite" aria-label={`${who} is ${doing}`}>
      <div className="mc-ws__h">
        <i className="mc-spin mc-ws__spin" aria-hidden="true" />
        <span className="mc-ws__t">
          <span className="mc-ws__tool">{doing === "writing the reply" ? "Reply" : who} → </span>
          {doing}
          <span className="mc-ws__tr"> · {((now - t0) / 1000).toFixed(1)}s</span>
        </span>
      </div>
    </div>
  );
}

/** A clean empty thread: generous space, Mimi looking around, one muted line. */
export function EmptyThread({ helper, children }: { helper: string; children?: ReactNode }) {
  return (
    <div className="mc-void">
      <MimiLooking size="sm" className="mc-void__mimi" />
      <p className="mc-void__t">{children ?? `Nothing here yet. Ask ${helper} anything to get started.`}</p>
    </div>
  );
}

function DateLine({ label }: { label: string }) {
  const [day, ...rest] = label.split(" ");
  return (
    <p className="mc-ts mc-mono">
      <b>{day}</b> {rest.join(" ")}
    </p>
  );
}

function Row({
  id,
  at,
  kind,
  who,
  showName,
  turn,
  tail,
  reacted,
  wide,
  children,
}: {
  /** Message id: the row gets `id="m-…"` so approval gates can scroll to their card. */
  id?: string;
  at: number;
  kind: "me" | "them" | "system" | "work";
  who?: Speaker;
  showName?: boolean;
  /** First message of a new turn (the speaker changed): a larger gap above. */
  turn?: boolean;
  tail?: boolean;
  /** Has reaction badges: leave room above for them. */
  reacted?: boolean;
  /** A structured answer: takes the full column. */
  wide?: boolean;
  children: ReactNode;
}) {
  const fresh = useFresh(at);
  const anim = fresh && consoleMotion.messageIn;
  if (kind === "system") return <div className={cx("mc-grp mc-grp--act", turn && "mc-grp--turn", anim && "mc-in")}>{children}</div>;
  if (kind === "work")
    return (
      <div id={id ? `m-${id}` : undefined} className={cx("mc-grp mc-grp--them mc-grp--work", turn && "mc-grp--turn", anim && "mc-in")}>
        {showName && who && who !== "me" && (
          <p className="mc-mh">
            <HelperFace name={who} size={18} />
            <span className="mc-mh__n">{who}</span>
          </p>
        )}
        <div className="mc-r--work">{children}</div>
      </div>
    );
  return (
    <div
      id={id ? `m-${id}` : undefined}
      className={cx("mc-grp", kind === "me" ? "mc-grp--me" : "mc-grp--them", wide && "mc-grp--answer", turn && "mc-grp--turn", anim && "mc-in")}
      data-tail={tail || undefined}
    >
      {showName && who && who !== "me" && (
        <p className="mc-mh">
          <HelperFace name={who} size={18} />
          <span className="mc-mh__n">{who}</span>
        </p>
      )}
      <div className={cx("mc-r", kind === "me" ? "mc-r--me" : "mc-r--them", reacted && "mc-r--rx", wide && "mc-r--answer")}>{children}</div>
    </div>
  );
}
