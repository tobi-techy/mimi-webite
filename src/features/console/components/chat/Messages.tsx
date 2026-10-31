"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { consoleMotion } from "@/config/console-motion";
import { ReactTarget, ReactionLayer, type LayerState } from "@/features/console/components/chat/Tapbacks";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { AskBubble, chatHref } from "@/features/console/components/chat/Ask";
import { decideCard } from "@/features/console/components/credit/limit-entry";
import { useLive } from "@/features/console/api/live-store";
import Link from "next/link";
import type { FaceState } from "@/features/console/demo/roster";
import { splitUrls, toPlainText } from "@/features/console/lib/plain-text";
import { safeHref } from "@/features/console/lib/safe-href";
import { StepLine, ThoughtBlock } from "@/features/console/components/chat/Work";
import { Answer } from "@/features/console/components/chat/answer/Answer";
import { FileChip, UploadLine, useApiBlob, useVoicePlayer } from "@/features/console/components/chat/Attachments";
import { Inline, plainInline } from "@/features/console/components/chat/answer/Inline";
import { Icon } from "@/features/console/components/ui/Icon";
import { StatusPill, StatusText } from "@/features/console/components/ui/StatusPill";
import { WithBank } from "@/features/console/components/ui/BankLogo";
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
import { helperNames, reactableKinds, type ProofLevel, type DecisionCard, type Message, type ReactableMessage, type Speaker, type Verdict } from "@/features/console/demo/types";
import { consoleThread } from "@/features/console/config";
import { chatterRuns, joinNames, liveWork, visibleMessages } from "@/features/console/lib/thread-view";
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

/**
 * Drops markers left open mid-stream so half-revealed `**bold**`, `==edit==`, `code`, a link or an
 * image never show raw (an image appears whole once its closing bracket arrives).
 */
export function closeOpenMarks(text: string): string {
  let t = text.replace(/!?\[[^\]\n]*(\]\([^)\s]*)?$/, "");
  for (const mark of ["**", "==", "`"]) {
    const parts = t.split(mark);
    if (parts.length % 2 === 0) {
      const last = t.lastIndexOf(mark);
      t = t.slice(0, last) + t.slice(last + mark.length);
    }
  }
  return t;
}

/** Plain text with http(s) URLs auto-linked (helper replies, WhatsApp-style). Line breaks come from CSS (pre-wrap). */
function PlainText({ text }: { text: string }) {
  return (
    <>
      {splitUrls(text).map((p, i) => {
        const href = p.url ? safeHref(p.url) : undefined;
        return href ? (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer">
            {p.text}
          </a>
        ) : (
          p.text
        );
      })}
    </>
  );
}

/**
 * Reveals a fresh helper message word by word, as plain text (Tobi, 29 Oct 2026: no markdown in replies).
 * Split on spaces only so line breaks stay inside the words they follow.
 */
function Streamed({ text, fresh }: { text: string; fresh: boolean }) {
  const words = text.split(" ");
  const animate = fresh && consoleMotion.streamText && !prefersReducedMotion();
  const [n, setN] = useState(animate ? 1 : words.length);
  useEffect(() => {
    if (n >= words.length) return;
    const t = window.setTimeout(() => setN((x) => x + 1), 34);
    return () => window.clearTimeout(t);
  }, [n, words.length]);
  const shown = toPlainText(n >= words.length ? text : closeOpenMarks(words.slice(0, n).join(" ")));
  return <PlainText text={shown} />;
}

const verdictLabel: Record<Verdict, string> = { verified: "Verified", self: "Self-reported", fake: "Fake alert" };
export function VerdictTag({ v, children }: { v: Verdict; children?: ReactNode }) {
  /* v2: verdicts are status pills (icon + tint), not mono tags */
  return (
    <StatusPill status={v} className="mc-vf">
      {children ?? verdictLabel[v]}
    </StatusPill>
  );
}

/* ---------- message kinds ---------- */

type Ctx = { slug: string };

/**
 * Your messages and helper replies are the same iMessage-style bubble (Tobi, 29 Oct 2026: "the agent post
 * too should take shape like the user message"): yours right-aligned with the tail bottom-right, helper
 * replies left-aligned on a neutral warm grey with the tail mirrored bottom-left, in plain text.
 */
function Bubble({ m, tail }: { m: Extract<Message, { kind: "text" }>; tail: boolean }) {
  const fresh = useFresh(m.at);
  if (m.from !== "me")
    return (
      <div className={cx("mc-b mc-b--them", tail && "mc-b--tail")}>
        <Streamed text={m.text} fresh={fresh} />
      </div>
    );
  return (
    <div className={cx("mc-b", tail && "mc-b--tail")}>
      <Inline text={m.text} />
    </div>
  );
}

/**
 * A handoff: one small line with the other helper's mark that opens her chat. In the chat that
 * handed it over it reads "Handed to Order: …" with a one-line result under it once she answers;
 * in her chat it reads "From Mimi: …" and points back.
 */
function HandoffLine({ m }: { m: Extract<Message, { kind: "step" }> }) {
  const conversations = useDemo((s) => s.conversations);
  const live = useLive((s) => s.status === "ready");
  const other = m.peer ?? m.to!;
  const href = chatHref(conversations, other, live && conversations.some((c) => c.api?.kind === "owner"));
  const text = m.text.replace(/\*\*/g, "");
  return (
    <p id={m.id} className={cx("mf-handoff", m.peer && "is-in")}>
      <Link className="mf-handoff__l" href={href} aria-label={`${text}. Open ${other}'s chat`}>
        <HelperFace name={other} size={16} quiet still />
        <span className="mf-handoff__t">{text}</span>
        <Icon name="chevron-right" />
      </Link>
      {m.result && (
        <Link className="mf-handoff__r" href={href}>
          {m.result}
        </Link>
      )}
    </p>
  );
}

function ProofCard({ m }: { m: Extract<Message, { kind: "proof" }> }) {
  return (
    <div className={cx("mc-pv", m.verdict === "fake" && "mc-pv--fake")}>
      <div className="mc-pv__top">
        <b>
          <WithBank text={m.title} size={20} />
        </b>
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
  /* an attachment the owner sent earlier: read through the API (bearer in a header), shown from a blob: URL */
  const remote = useApiBlob(m.remote && !m.photos.length ? { from: "media", id: m.remote } : undefined, true);
  const photos = m.photos.length ? m.photos : remote.url ? [remote.url] : [];
  const shown = photos.slice(0, 3);
  if (!shown.length && m.remote)
    return (
      <div className="mc-fanwrap">
        {remote.state === "error" ? (
          <button type="button" className="mc-fan mc-fan--one mc-fan--ph" onClick={remote.retry} aria-label="Couldn't load the photo. Try again">
            <span className="mc-mono">Couldn't load the photo · Retry</span>
          </button>
        ) : (
          <span className="mc-fan mc-fan--one mc-fan--ph mc-skel" role="img" aria-label="Loading the photo" />
        )}
        <span className="mc-fanl">
          <Icon name="image" />
          {m.label}
        </span>
      </div>
    );
  return (
    <div className="mc-fanwrap">
      {m.upload && <UploadLine slug={ctx.slug} id={m.id} upload={m.upload} />}
      <button
        type="button"
        className={cx("mc-fan", open && "is-open", shown.length === 1 && "mc-fan--one")}
        aria-expanded={open}
        aria-label={`${m.label}. ${open ? "Close" : "Open"} the photos`}
        onClick={() => toggleFan(ctx.slug, m.id)}
      >
        {shown.map((src, i) => {
          const [x, y, r] = pos[i + (3 - shown.length)] ?? [0, 0, 0];
          return <img key={src} src={src} alt="" decoding="async" style={{ left: x, top: y, transform: `rotate(${r}deg)`, zIndex: i }} />;
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

function VoiceNote({ m, ctx }: { m: Extract<Message, { kind: "voice" }>; ctx: Ctx }) {
  const me = m.from === "me";
  const [simPlaying, setPlaying] = useState(false);
  const [simP, setP] = useState(0);
  const [open, setOpen] = useState(false);
  const at = useRef(0);
  const bars = useMemo(() => waveOf(m.id, VOICE_BARS), [m.id]);
  /* real audio (API threads): fetched on the first tap through the API client, played from a blob: URL */
  const player = useVoicePlayer(m.audio);
  const real = !!m.audio;
  const playing = real ? player.playing : simPlaying;
  const p = real ? player.progress : simP;
  const seconds = real ? (player.duration ?? m.seconds) : m.seconds;

  /* simulated playback (sample threads): rAF progress over the stated duration, resumes where it paused */
  useEffect(() => {
    if (!simPlaying || real) return;
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
  }, [simPlaying, m.seconds, real]);

  const started = playing || p > 0;
  const left = started ? Math.max(0, Math.ceil(seconds * (1 - p))) : seconds;
  const toggle = () => (real ? player.toggle() : setPlaying((x) => !x));
  const loading = real && player.state === "loading";
  const known = seconds > 0;
  return (
    <div className={cx("mc-vn", me && "mc-vn--me")}>
      {m.upload && <UploadLine slug={ctx.slug} id={m.id} upload={m.upload} />}
      <div className={cx("mc-vn__b", playing && "is-play")} aria-busy={loading || undefined}>
        <button
          type="button"
          className="mc-vn__p"
          aria-label={loading ? "Loading voice note" : `${playing ? "Pause" : "Play"} voice note${known ? `, ${clock(seconds)}` : ""}`}
          aria-pressed={playing}
          onClick={toggle}
        >
          {loading ? <i className="mc-spin" aria-hidden="true" /> : <Icon name={playing ? "pause" : "play"} />}
        </button>
        <span className="mc-vn__w" aria-hidden="true" onClick={toggle}>
          {bars.map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} className={cx((i + 0.5) / bars.length <= p && "is-on")} />
          ))}
        </span>
        <span className="mc-vn__t mc-mono" aria-hidden="true">
          {known ? clock(left) : "-:--"}
        </span>
      </div>
      {real && player.state === "error" && (
        <p className="mc-up mc-up--bad mc-mono" role="alert">
          <span>Couldn't play the voice note.</span>
          <button type="button" className="mc-up__retry" onClick={player.toggle}>
            Retry
          </button>
        </p>
      )}
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

const proofWord: Record<ProofLevel, string> = { verified: "Verified", likely: "Likely", estimated: "Estimated" };

/**
 * Decision card, round 2: what will happen in one title and one quiet sentence, at most one
 * preview of what goes out, then the figures as two-line rows (label over its proof or flag on the
 * left, amount over its note on the right, one shared right edge) and two equal buttons. Plans show
 * only their total here; the shop-by-shop list opens on Review. No icon tile, no pills in rows, so
 * every left edge sits on the card's 16px line.
 */
function CardView({ m, ctx }: { m: Extract<Message, { kind: "card" }>; ctx: Ctx }) {
  const c: DecisionCard = m.card;
  const fresh = useFresh(m.at);
  const plan = c.kind === "plan";
  const live = c.rows.filter((r) => r.tone !== "Skip");
  const act = cardActions(c);
  const tier = tierOf(c);
  const total = c.amount ?? (plan || c.kind === "order" ? live.reduce((s, r) => s + (r.amount ?? 0), 0) : undefined);
  const needs = c.status === "needs";
  /* a proof word only earns its line when the rows differ; when every row is verified, say it once */
  const proofs = new Set(c.rows.map((r) => r.proof).filter(Boolean));
  const allVerified = !plan && c.rows.length > 1 && c.rows.every((r) => r.proof === "verified");
  const mixedProof = proofs.size > 1 || c.rows.some((r) => !r.proof);
  const sub =
    plan && needs
      ? "One WhatsApp reminder to each shop. Nothing goes out until you approve."
      : allVerified
        ? `${c.sub} · all verified`
        : c.sub;
  const showTotal = total !== undefined && total > 0 && !sub.includes(naira(total));
  return (
    <div
      className={cx("mc-apc v2-dc", needs && fresh && consoleMotion.approvalAttention && "is-attn")}
      title={`Risk tier: ${tier}`}
    >
      <div className="v2-dc__h">
        <div className="v2-dc__t">
          <b>{c.title}</b>
          <small>{sub}</small>
        </div>
        {c.status === "sending" && <StatusPill status="running">{plan ? "Sending" : "Saving"}</StatusPill>}
        {c.status === "sent" && <StatusPill status="sent">{plan || c.kind === "brand" ? "Sent" : "Done"}</StatusPill>}
        {c.status === "declined" && <StatusPill status="skipped">Discarded</StatusPill>}
      </div>
      {c.email && (
        <div className="v2-dc__quote">
          <p className="v2-dc__to">
            To {c.email.to} · {c.email.subject}
          </p>
          <p>{c.email.body}</p>
        </div>
      )}
      {!c.email && c.message && needs && (
        <div className="v2-dc__quote">
          <p className="v2-dc__to">To {c.message.to}</p>
          <p>{c.message.text}</p>
        </div>
      )}
      <dl className="v2-dc__rows">
        {!plan &&
          c.rows.map((r) => {
            const side = r.flag ? (
              <StatusText status="fake">{r.flag}</StatusText>
            ) : r.proof && mixedProof ? (
              <StatusText status={r.proof === "verified" ? "verified" : "self"}>{proofWord[r.proof]}</StatusText>
            ) : null;
            const note = r.tone ?? r.note;
            return (
              <div key={r.label}>
                <dt>
                  <span>
                    <WithBank text={r.label} />
                  </span>
                  {side}
                </dt>
                <dd>
                  {r.amount !== undefined ? (
                    <>
                      <span className="v2-num">{naira(r.amount)}</span>
                      {note && <small>{note}</small>}
                    </>
                  ) : (
                    note && <span className="v2-dc__note">{note}</span>
                  )}
                </dd>
              </div>
            );
          })}
        {showTotal && (
          <div className="v2-dc__total">
            <dt>
              <span>{plan ? "Total owed" : "Total"}</span>
            </dt>
            <dd>
              <span className="v2-num">{naira(total)}</span>
            </dd>
          </div>
        )}
      </dl>
      {needs && (
        <div className="v2-dc__f">
          <button
            type="button"
            className="v2-btn"
            onClick={() => (act.secondary === "Review" ? openSheet(ctx.slug, m.id) : declineCard(ctx.slug, m.id))}
          >
            {act.secondary}
          </button>
          <button type="button" className="v2-btn v2-btn--pri" onClick={() => decideCard(ctx.slug, m)}>
            {act.primary}
          </button>
        </div>
      )}
      {c.status === "sending" && (
        <p className="v2-dc__done">
          <i className="mc-spin" aria-hidden="true" />
          {plan ? "Sending on WhatsApp" : "Saving"}
        </p>
      )}
      {c.status === "sent" && (
        <p className="v2-dc__done" role="status">
          {c.doneText} · {c.sentAt}
        </p>
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
  if (m.kind === "voice") return <VoiceNote m={m} ctx={ctx} />;
  if (m.kind === "file") return <FileChip m={m} slug={ctx.slug} />;
  if (m.kind === "card") return <CardView m={m} ctx={ctx} />;
  if (m.kind === "doc") return <DocChip m={m} />;
  if (m.kind === "computer") return <ComputerChip m={m} />;
  if (m.kind === "answer") return <Answer m={m} />;
  if (m.kind === "ask") return <AskBubble m={m} slug={ctx.slug} />;
  return null;
}

/** What Copy puts on the clipboard, and how a message is named to screen readers. */
function plainOf(m: ReactableMessage): string {
  const strip = plainInline;
  if (m.kind === "text") return m.from === "me" ? strip(m.text) : toPlainText(m.text);
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

export function MessageFeed({ slug, messages: all, typing: typingIn }: { slug: string; messages: Message[]; typing: Speaker | null }) {
  const ctx = { slug };
  /* iMessage reading (consoleThread.showWork off): no reasoning or step lines, just bubbles and cards,
     with typing dots while the helper writes or works (the header carries the one-line status) */
  const showWork = consoleThread.showWork;
  const messages = useMemo(() => visibleMessages(all, showWork), [all, showWork]);
  const busy = showWork ? null : (liveWork(all)?.who as Speaker | undefined);
  const typing: Speaker | null = typingIn ?? busy ?? null;
  /* helper-to-helper chatter folds into one quiet row; Mimi's message after it is the answer */
  const runs = useMemo(() => chatterRuns(messages), [messages]);
  const [openRuns, setOpenRuns] = useState<string[]>([]);
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
  /** The turn header face: working while this turn runs, waiting while it holds a pending approval. */
  const turnFace = (i: number, who: Speaker): FaceState => {
    let waiting = false;
    for (let j = i; j < messages.length; j++) {
      const x = messages[j]!;
      const s = speakerOf(x);
      if (s && s !== who) return waiting ? "waiting" : "idle";
      if ((x.kind === "thought" && x.live) || (x.kind === "step" && x.state === "run")) return "working";
      if ((x.kind === "card" && x.card.status === "needs") || (x.kind === "step" && x.variant === "gate" && x.state === "wait")) waiting = true;
    }
    if (typing === who) return "working";
    return waiting ? "waiting" : "idle";
  };
  messages.forEach((m, i) => {
    const run = runs.find((r) => i >= r.start && i < r.start + r.count);
    if (run) {
      const key = messages[run.start]!.id;
      const open = openRuns.includes(key);
      if (i === run.start)
        items.push(
          <button
            key={`chat-${key}`}
            type="button"
            className={cx("mc-chat", open && "is-open")}
            aria-expanded={open}
            onClick={() => setOpenRuns((cur) => (open ? cur.filter((x) => x !== key) : [...cur, key]))}
          >
            {open ? "Hide" : `${run.count} messages between ${joinNames(run.names)}`}
          </button>,
        );
      if (!open) return;
    }
    const who = speakerOf(m);
    const prev = speakerBefore(i);
    const next = i < messages.length - 1 ? speakerOf(messages[i + 1]!) : typing;
    if (m.kind === "date") {
      items.push(<DateLine key={m.id} label={m.label} />);
      return;
    }
    if (m.kind === "event") {
      items.push(
        <p key={m.id} className={cx("mc-ev", m.tone === "stop" && "mc-ev--stop", isFreshAt(m.at) && "mc-in")} role={m.tone === "stop" ? "status" : "note"}>
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
    /* the trail is off: a finished handoff reads as one small line with the new helper's mark */
    if (!showWork && m.kind === "step" && m.variant === "handoff" && m.to) {
      items.push(<HandoffLine key={m.id} m={m} />);
      return;
    }
    if (m.kind === "thought" || m.kind === "step") {
      items.push(
        <Row
          key={m.id}
          id={m.id}
          at={m.at}
          kind="work"
          who={m.from}
          showName={m.from !== prev}
          turn={m.from !== prev}
          face={m.from !== prev ? turnFace(i, m.from) : undefined}
        >
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
          id={m.id}
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
        face={showName ? turnFace(i, who) : undefined}
        turn={who !== prev}
        tail={tail}
        reacted={isReactable(m) && !!m.reactions?.length}
        wide={m.kind === "answer"}
      >
        {body}
      </Row>,
    );
    if (me && m.kind === "text" && m.queued)
      items.push(
        <p key={`${m.id}-q`} className="mc-qd" role="status">
          Queued · after current task
        </p>,
      );
    /* no "Read" receipts (Tobi, 29 Oct 2026: threads too crowded with text) */
  });
  if (typing && typing !== "me") {
    const prev = speakerBefore(messages.length);
    items.push(
      showWork ? (
        <Row key="typing" at={-1} kind="work" who={typing} showName={typing !== prev} turn={typing !== prev} face="working" tail>
          <Working who={typing} slug={slug} />
        </Row>
      ) : (
        <Row key="typing" at={-1} kind="them" who={typing} showName={typing !== prev} turn={typing !== prev} face="working" tail>
          <TypingDots who={typing} />
        </Row>
      ),
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
        at={target.at}
        queued={target.kind === "text" && !!target.queued}
        onClose={close}
        copy={
          <div className={cx("mc-rx", `mc-rx--${target.kind}`, !!target.reactions?.length && "has-rx")}>{bodyOf(target, ctx, who !== after)}</div>
        }
      />,
    );
  }
  return <>{items}</>;
}

/** iMessage typing indicator: three dots in a reply-grey bubble with a tail. */
function TypingDots({ who }: { who: Exclude<Speaker, "me"> }) {
  return (
    <div className="mc-typd" role="status" aria-live="polite" aria-label={`${who} is typing`}>
      <i />
      <i />
      <i />
    </div>
  );
}

/**
 * While a helper works (consoleThread.showWork on): a live work-step line instead of a loader ("Reply → writing · 0.8s"),
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
const isHelperName = (v: string): v is (typeof helperNames)[number] => (helperNames as readonly string[]).includes(v);

export function EmptyThread({ helper, children }: { helper: string; children?: ReactNode }) {
  return (
    <div className="mc-void">
      {isHelperName(helper) ? (
        <HelperFace name={helper} size={72} className="mc-void__helper" />
      ) : (
        <MimiLooking size="sm" className="mc-void__mimi" />
      )}
      <p className="mc-void__t">{children ?? `Nothing here yet. Ask ${helper} anything to get started.`}</p>
    </div>
  );
}

export function DateLine({ label }: { label: string }) {
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
  face,
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
  /** The turn header face's state (working / waiting), from the turn's live steps and pending cards. */
  face?: FaceState;
  children: ReactNode;
}) {
  const fresh = useFresh(at);
  const anim = fresh && consoleMotion.messageIn;
  if (kind === "system") return <div className={cx("mc-grp mc-grp--act", turn && "mc-grp--turn", anim && "mc-in")}>{children}</div>;
  if (kind === "work")
    return (
      <div id={id ? `m-${id}` : undefined} className={cx("mc-grp mc-grp--them mc-grp--work", turn && "mc-grp--turn", anim && "mc-in")} data-from={who && who !== "me" ? who : undefined}>
        {showName && who && who !== "me" && (
          <p className="mc-mh">
            <HelperFace name={who} size={32} state={face} quiet />
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
      data-from={kind === "them" && who ? who : undefined}
    >
      {showName && who && who !== "me" && (
        <p className="mc-mh">
          <HelperFace name={who} size={32} state={face} quiet />
          <span className="mc-mh__n">{who}</span>
        </p>
      )}
      <div className={cx("mc-r", kind === "me" ? "mc-r--me" : "mc-r--them", reacted && "mc-r--rx", wide && "mc-r--answer")}>{children}</div>
    </div>
  );
}
