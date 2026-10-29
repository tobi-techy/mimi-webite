"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { consoleMotion } from "@/config/console-motion";
import { createPortal } from "react-dom";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { interruptQueued, react, unreact } from "@/features/console/demo/engine";
import { helperNames, type Reaction, type TapbackKey } from "@/features/console/demo/types";
import { useToast } from "@/features/console/hooks/use-toast";
import { badgeOrder, leftReactions, reactionEmoji } from "@/features/console/lib/reactions";
import { timeLabel } from "@/features/console/lib/thread-view";
import { cx } from "@/lib/cx";

/**
 * iMessage tapbacks in the Factory skin, as real emoji (29 Oct 2026): ❤️ 👍 👎 😂 ‼️ ❓ in the system
 * emoji font, a 30px badge on the message's top corner, a pill of 30px emoji that springs out of the
 * message, and the emoji you pick flies into the badge and pops (motion switches in console-motion.ts). Double-tap / double-click, long-press (350ms) or
 * right-click a message: it lifts in place, the thread dims (flat, no blur), and the six classic
 * tapbacks pop above it (below when near the top) with a "+" for any emoji. Phones also get
 * Reply / Copy under the message (phones and desktop). One reaction per person; the same one again removes it.
 */

export const TAPBACKS: { key: TapbackKey; label: string; verb: string }[] = [
  { key: "heart", label: "Loved", verb: "loved" },
  { key: "like", label: "Liked", verb: "liked" },
  { key: "dislike", label: "Disliked", verb: "disliked" },
  { key: "haha", label: "Laughed at", verb: "laughed at" },
  { key: "bang", label: "Emphasized", verb: "emphasized" },
  { key: "question", label: "Questioned", verb: "questioned" },
];
const tapbackOf = (r: string) => TAPBACKS.find((t) => t.key === r);
export const reactionVerb = (r: string) => tapbackOf(r)?.verb ?? `reacted ${r} to`;

/** A compact any-emoji picker (no dependency): the sets a trader reacts with most. */
const EMOJI: { title: string; list: string[] }[] = [
  { title: "Frequently used", list: ["👍", "❤️", "😂", "🙏", "🔥", "👏", "💯", "🎉", "😮", "😢", "👀", "✅", "🙌", "💪"] },
  {
    title: "Smileys",
    list: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "🙂", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😋", "😎", "🤓", "🤔", "🤨", "😐", "😑", "😶", "🙄", "😏", "😬", "😌", "😴", "🥳", "🤯", "😳", "🥺", "😭", "😤", "😡", "🤝"],
  },
  { title: "Hands", list: ["👌", "🤌", "✌️", "🤞", "🫡", "👋", "🤙", "👊", "✊", "🫶", "👐", "🤲", "☝️", "👆"] },
  { title: "Trade", list: ["💰", "💵", "💸", "🏦", "🧾", "📦", "🚚", "🛒", "🏪", "📈", "📉", "📊", "🗓️", "⏰", "📞", "📍", "🔒", "🔑", "⚠️", "❗", "❓", "⭐", "🌟", "⚡"] },
];

const isHelper = (by: string) => by === "Mimi" || (helperNames as readonly string[]).includes(by);
const nameOf = (by: string) => (by === "me" ? "You" : by);
const initials = (by: string) =>
  by === "me"
    ? "EO"
    : by
        .split(/\s+/)
        .filter((w) => /^[A-Za-z]/.test(w))
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("");

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The reaction as a real system emoji (tapback keys map to ❤️ 👍 👎 😂 ‼️ ❓). */
export function Glyph({ r }: { r: string }) {
  return (
    <span className="mc-gl mc-gl--emoji" aria-hidden="true">
      {reactionEmoji(r)}
    </span>
  );
}

/**
 * Where the emoji you just picked left the pill, so the badge can fly it in from there.
 * Set on pick, read once by the badge that mounts for it.
 */
const flight: { id: string; r: string; x: number; y: number } | { id: ""; r: ""; x: 0; y: 0 } = { id: "", r: "", x: 0, y: 0 };
function launch(id: string, r: string, el: HTMLElement | null) {
  if (!el || !consoleMotion.reactionFly || reduced()) return;
  const b = el.getBoundingClientRect();
  Object.assign(flight, { id, r, x: b.left + b.width / 2, y: b.top + b.height / 2 });
}

/** One badge emoji. A fresh one of yours flies in from the pill (spring 0 → 1.2 → 1); others just pop. */
function BadgeGlyph({ id, q, fresh, leaving }: { id: string; q: Reaction; fresh: boolean; leaving: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !fresh || q.by !== "me" || flight.id !== id || flight.r !== q.r || typeof el.animate !== "function") return;
    const b = el.getBoundingClientRect();
    const dx = flight.x - (b.left + b.width / 2);
    const dy = flight.y - (b.top + b.height / 2);
    Object.assign(flight, { id: "", r: "", x: 0, y: 0 });
    el.classList.add("is-flying");
    const a = el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(1.5)`, opacity: 1 },
        { transform: "translate(0, 0) scale(1.2)", opacity: 1, offset: 0.62 },
        { transform: "translate(0, 0) scale(.94)", offset: 0.82 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    a.onfinish = a.oncancel = () => el.classList.remove("is-flying");
  }, [fresh, id, q.by, q.r]);
  return (
    <span ref={ref} className={cx("mc-rxg", q.by === "me" && "is-mine", fresh && "is-fresh", leaving && "is-leaving")}>
      <Glyph r={q.r} />
    </span>
  );
}

/** Badges pinned to the message's top corner (opposite the tail). Several stack and overlap. */
export function Badges({ id, list, side, onOpen }: { id: string; list: Reaction[]; side: "left" | "right"; onOpen?: (el: HTMLElement) => void }) {
  const [now] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  // removed reactions stay a moment so they can shrink out (consoleMotion.reactionExit)
  const [leaving, setLeaving] = useState<Reaction[]>([]);
  const prev = useRef(list);
  useEffect(() => {
    const gone = leftReactions(prev.current, list);
    prev.current = list;
    if (!gone.length || !consoleMotion.reactionExit || reduced()) return;
    setLeaving((cur) => [...cur.filter((q) => !gone.some((g) => g.by === q.by)), ...gone]);
    const t = window.setTimeout(() => setLeaving((cur) => cur.filter((q) => !gone.includes(q))), 240);
    return () => window.clearTimeout(t);
  }, [list]);
  const ghosts = leaving.filter((g) => !list.some((q) => q.by === g.by && q.r === g.r));
  if (!list.length && !ghosts.length) return null;
  // yours sits in front (iMessage); show at most three
  const ordered = badgeOrder(list);
  const label = `Reactions: ${list.map((q) => `${nameOf(q.by)} ${reactionVerb(q.r).replace(/ (at|to)$/, "")}`).join(", ")}. Show who reacted`;
  return (
    <button
      type="button"
      className={cx("mc-rxb", `mc-rxb--${side}`)}
      aria-label={label}
      tabIndex={list.length ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation();
        if (list.length) onOpen?.(e.currentTarget);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {ghosts.map((q) => (
        <BadgeGlyph key={`out-${q.by}-${q.r}`} id={id} q={q} fresh={false} leaving />
      ))}
      {ordered.map((q) => (
        <BadgeGlyph key={`${q.by}-${q.r}`} id={id} q={q} fresh={!!q.at && now - q.at < 1500} leaving={false} />
      ))}
    </button>
  );
}

/* ---------- triggers ---------- */

const INTERACTIVE = "button, a, input, textarea, select, [role='button'], fieldset .mc-op";

/**
 * Wraps a reactable message. Double-tap / double-click, long-press ~350ms on touch, right-click,
 * or Enter / Shift+F10 / ContextMenu when focused opens the tapback bar.
 */
export function ReactTarget({
  id,
  kind,
  side,
  label,
  lifted,
  reactions,
  onOpen,
  onWho,
  children,
}: {
  id: string;
  kind: string;
  side: "left" | "right";
  label: string;
  lifted: boolean;
  reactions?: Reaction[];
  onOpen: (el: HTMLElement) => void;
  onWho: (el: HTMLElement) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const press = useRef<{ t: number; x: number; y: number; fired: boolean } | null>(null);
  const lastTap = useRef(0);
  const open = () => ref.current && onOpen(ref.current);
  const clear = () => {
    if (press.current) window.clearTimeout(press.current.t);
  };
  useEffect(() => clear, []);
  return (
    <div
      ref={ref}
      className={cx("mc-rx", `mc-rx--${kind}`, !!reactions?.length && "has-rx", lifted && "is-lifted")}
      tabIndex={0}
      role="group"
      aria-label={`${label}. Press Enter to react.`}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " " || e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
          e.preventDefault();
          open();
        }
      }}
      onDoubleClick={(e) => {
        const t = e.target as Element;
        if (t.closest(INTERACTIVE) && !t.closest(".mc-fan")) return;
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
        open();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        clear();
        open();
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        clear();
        const t = window.setTimeout(() => {
          if (press.current) press.current.fired = true;
          open();
        }, 350);
        press.current = { t, x: e.clientX, y: e.clientY, fired: false };
      }}
      onPointerMove={(e) => {
        const p = press.current;
        if (p && !p.fired && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) clear();
      }}
      onPointerUp={(e) => {
        clear();
        if (e.pointerType === "mouse" || press.current?.fired) return;
        const now = Date.now();
        const t = e.target as Element;
        const ok = !t.closest(INTERACTIVE) || !!t.closest(".mc-fan");
        if (ok && now - lastTap.current < 300) {
          lastTap.current = 0;
          open();
        } else lastTap.current = now;
      }}
      onPointerCancel={clear}
      onClickCapture={(e) => {
        if (press.current?.fired) {
          e.preventDefault();
          e.stopPropagation();
          press.current = null;
        }
      }}
    >
      {children}
      <Badges id={id} list={reactions ?? []} side={side === "left" ? "right" : "left"} onOpen={onWho} />
    </div>
  );
}

/* ---------- the layer: lifted copy, dim, bar, picker, phone actions, who reacted ---------- */

export type LayerState = {
  id: string;
  mode: "bar" | "who";
  /** The message's box (bar mode) or the badge's box (who mode). */
  rect: { top: number; left: number; width: number; height: number };
  me: boolean;
  origin: HTMLElement | null;
};

/* the pill: seven 44px buttons, 2px apart, 5px padding, hairline border */
const BAR_W = 7 * 44 + 6 * 2 + 10 + 2;
const BAR_H = 56;
const PICK_H = 300;
const MENU_H = 98 + 33;
const GAP = 8;
const EDGE = 12;

const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches;

export function ReactionLayer({
  slug,
  state,
  reactions,
  copyText,
  speaker,
  at,
  queued,
  copy,
  onClose,
}: {
  slug: string;
  state: LayerState;
  reactions: Reaction[];
  /** The text Copy puts on the clipboard. */
  copyText: string;
  speaker: string;
  /** When the message was sent: shown at the top of the actions menu (no per-bubble timestamps). */
  at?: number;
  /** Your message is waiting for the current task: the menu offers "Interrupt now". */
  queued?: boolean;
  /** The lifted copy of the message (rendered inert). */
  copy: ReactNode;
  onClose: () => void;
}) {
  // only mounted after a gesture on the client, so the portal host is there on first render
  const [host] = useState<Element | null>(() => (typeof document === "undefined" ? null : (document.querySelector(".mc-app") ?? document.body)));
  const [picker, setPicker] = useState(false);
  const [phone] = useState(isPhone);
  const say = useToast();
  const box = useRef<HTMLDivElement>(null);
  // the click a long-press release fires lands on the dim; only a fresh press on the dim closes
  const armed = useRef(false);
  const dimProps = {
    onPointerDown: () => {
      armed.current = true;
    },
    onClick: () => {
      if (armed.current) onClose();
    },
    "aria-hidden": true,
  } as const;
  const mine = reactions.find((q) => q.by === "me")?.r;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (picker) setPicker(false);
        else onClose();
      }
    };
    const onResize = () => onClose();
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [picker, onClose]);

  // focus the first control when opened, and the picker's first emoji when it opens
  useEffect(() => {
    if (!host) return;
    const sel = picker ? ".mc-rxp button" : state.mode === "who" ? ".mc-rxw button, .mc-rxw" : ".mc-rxbar button";
    (box.current?.querySelector(sel) as HTMLElement | null)?.focus({ preventScroll: true });
  }, [host, picker, state.mode]);

  if (!host) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = state.rect;

  const pick = (key: string, el?: HTMLElement | null) => {
    if (mine !== key) launch(state.id, key, el ?? null);
    react(slug, state.id, key);
    onClose();
  };

  if (state.mode === "who") {
    const style = phone
      ? undefined
      : {
          top: Math.min(r.top + r.height + GAP, vh - 280),
          left: Math.max(EDGE, Math.min(r.left + r.width / 2 - 140, vw - 280 - EDGE)),
        };
    return createPortal(
      <div className="mc-rxl" ref={box}>
        <div className="mc-rxl__dim mc-rxl__dim--soft" {...dimProps} />
        <div className={cx("mc-rxw", phone && "mc-rxw--sheet")} style={style} role="dialog" aria-label="Who reacted" tabIndex={-1}>
          <p className="mc-rxw__h mc-mono">
            Reactions · {reactions.length}
            <button type="button" className="mc-rxw__x" aria-label="Close" onClick={onClose}>
              <Icon name="x" />
            </button>
          </p>
          <ul>
            {reactions.map((q) => (
              <li key={q.by} className="mc-rxw__r">
                <span className={cx("mc-rxg mc-rxg--row", q.by === "me" && "is-mine")}>
                  <Glyph r={q.r} />
                </span>
                {isHelper(q.by) ? (
                  <HelperFace name={q.by as Parameters<typeof HelperFace>[0]["name"]} size={24} />
                ) : q.by === "me" ? (
                  <span className="mc-rxw__ini mc-mono">{initials(q.by)}</span>
                ) : (
                  <ShopAvatar name={q.by} size={28} />
                )}
                <span className="mc-rxw__nm">
                  {nameOf(q.by)}
                  <small className="mc-mono">{tapbackOf(q.r)?.label ?? `Reacted ${q.r}`}</small>
                </span>
                {q.by === "me" && (
                  <button
                    type="button"
                    className="mc-btn mc-rxw__rm"
                    onClick={() => {
                      unreact(slug, state.id);
                      onClose();
                    }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>,
      host,
    );
  }

  /* bar mode: place the lifted copy, then the bar above it (below when near the top), and on
     phones the action list under it; shift everything up if the list would leave the screen */
  let top = r.top;
  const minTop = EDGE + BAR_H + GAP;
  let barAbove = top - BAR_H - GAP >= EDGE + (phone ? 0 : 56);
  /* the Reply / Copy list sits under the message on every screen size */
  const bottom = top + r.height + GAP + MENU_H + (queued ? 48 : 0) + EDGE + (barAbove ? 0 : BAR_H + GAP);
  if (bottom > vh) {
    top = Math.max(minTop, top - (bottom - vh));
    barAbove = true;
  }
  const barTop = barAbove ? top - BAR_H - GAP : top + r.height + GAP;
  const anchorLeft = state.me ? r.left + r.width - BAR_W : r.left - 4;
  const barLeft = Math.max(EDGE, Math.min(anchorLeft, vw - BAR_W - EDGE));
  const pickTop = Math.max(EDGE, Math.min(barAbove ? barTop + BAR_H - PICK_H : barTop, vh - PICK_H - EDGE));
  const menuTop = barAbove ? top + r.height + GAP : barTop + BAR_H + GAP;
  const menuLeft = state.me ? Math.max(EDGE, r.left + r.width - 220) : Math.max(EDGE, r.left);

  const onBarKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    const btns = [...e.currentTarget.querySelectorAll("button")];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    const n =
      e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + btns.length) % btns.length;
    btns[n]?.focus();
    e.preventDefault();
  };

  return createPortal(
    <div className="mc-rxl" ref={box}>
      <div className="mc-rxl__dim" {...dimProps} />
      <div
        className={cx("mc-rxl__lift", state.me && "mc-rxl__lift--me")}
        style={{ top, left: r.left, width: r.width }}
        inert
        aria-hidden="true"
      >
        <div className={cx("mc-r", state.me && "mc-r--me")}>{copy}</div>
      </div>
      {!picker ? (
        <div
          className={cx(
            "mc-rxbar",
            !barAbove && "is-below",
            state.me && "is-me",
            consoleMotion.reactionPop && "is-pop",
            consoleMotion.reactionStagger && "is-stagger",
          )}
          style={{ top: barTop, left: barLeft }}
          role="toolbar"
          aria-label={speaker === "You" ? "React to your message" : `React to ${speaker}'s message`}
          onKeyDown={onBarKey}
        >
          {TAPBACKS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              className={cx("mc-rxbar__b", mine === t.key && "is-on")}
              style={{ "--i": i } as CSSProperties}
              aria-label={t.label}
              aria-pressed={mine === t.key}
              onClick={(e) => pick(t.key, e.currentTarget)}
            >
              <Glyph r={t.key} />
            </button>
          ))}
          <button
            type="button"
            className={cx("mc-rxbar__b mc-rxbar__more", mine && !tapbackOf(mine) && "is-on")}
            style={{ "--i": TAPBACKS.length } as CSSProperties}
            aria-label={mine && !tapbackOf(mine) ? `Reacted ${mine}. Pick another emoji` : "More reactions"}
            aria-haspopup="dialog"
            onClick={() => setPicker(true)}
          >
            {mine && !tapbackOf(mine) ? <Glyph r={mine} /> : <Icon name="plus" />}
          </button>
        </div>
      ) : (
        <div className="mc-rxp" style={{ top: pickTop, left: barLeft }} role="dialog" aria-label="React with any emoji">
          <div className="mc-rxp__h">
            <button type="button" className="mc-rxp__back" aria-label="Back to tapbacks" onClick={() => setPicker(false)}>
              <Icon name="chevron-left" />
            </button>
            <span className="mc-mono">Any emoji</span>
          </div>
          <div className="mc-rxp__s">
            {EMOJI.map((sec) => (
              <section key={sec.title}>
                <p className="mc-mono">{sec.title}</p>
                <div className="mc-rxp__g">
                  {sec.list.map((em) => (
                    <button key={em} type="button" className={cx(mine === em && "is-on")} aria-label={`React with ${em}`} aria-pressed={mine === em} onClick={(e) => pick(em, e.currentTarget)}>
                      {em}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      {!picker && (
        <div className="mc-rxm" style={{ top: menuTop, left: menuLeft }} role="menu" aria-label="Message actions">
          {!!at && at > 0 && <p className="mc-rxm__t mc-mono">{timeLabel(at)}</p>}
          {queued && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onClose();
                interruptQueued(slug, state.id);
              }}
            >
              Interrupt now
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose();
              const ta = document.querySelector<HTMLTextAreaElement>(".mc-cmp textarea");
              ta?.focus();
              say(speaker === "You" ? "Replying to your message" : `Replying to ${speaker}`);
            }}
          >
            Reply
            <Icon name="reply" />
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onClose();
              void navigator.clipboard?.writeText(copyText).then(
                () => say("Copied"),
                () => say("Couldn't copy"),
              );
            }}
          >
            Copy
            <Icon name="copy" />
          </button>
        </div>
      )}
    </div>,
    host,
  );
}
