"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { react, unreact } from "@/features/console/demo/engine";
import { helperNames, type Reaction, type TapbackKey } from "@/features/console/demo/types";
import { useToast } from "@/features/console/hooks/use-toast";
import { cx } from "@/lib/cx";

/**
 * iMessage tapbacks in the Factory skin. Double-tap / double-click, long-press (350ms) or
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

const HEART = "M12 20.6s-8.2-4.9-8.2-11a4.6 4.6 0 0 1 8.2-2.9 4.6 4.6 0 0 1 8.2 2.9c0 6.1-8.2 11-8.2 11z";
const THUMB_UP =
  "M7.5 10.5v10H4.2a1.2 1.2 0 0 1-1.2-1.2v-7.6a1.2 1.2 0 0 1 1.2-1.2zM9.5 10.2l3.3-7a2.3 2.3 0 0 1 2.3 2.7l-.6 3.6h4.9a2 2 0 0 1 2 2.4l-1.4 7a2.4 2.4 0 0 1-2.4 1.9H9.5z";

/** The tapback glyph (or the emoji). Drawn in currentColor so your own reaction can invert. */
export function Glyph({ r }: { r: string }) {
  if (r === "heart")
    return (
      <svg className="mc-gl" viewBox="0 0 24 24" aria-hidden="true">
        <path d={HEART} fill="currentColor" />
      </svg>
    );
  if (r === "like" || r === "dislike")
    return (
      <svg className="mc-gl" viewBox="0 0 24 24" aria-hidden="true" style={r === "dislike" ? { transform: "rotate(180deg)" } : undefined}>
        <path d={THUMB_UP} fill="currentColor" />
      </svg>
    );
  if (r === "haha")
    return (
      <span className="mc-gl mc-gl--haha" aria-hidden="true">
        HA
        <br />
        HA
      </span>
    );
  if (r === "bang")
    return (
      <span className="mc-gl mc-gl--bang" aria-hidden="true">
        !!
      </span>
    );
  if (r === "question")
    return (
      <span className="mc-gl mc-gl--q" aria-hidden="true">
        ?
      </span>
    );
  return (
    <span className="mc-gl mc-gl--emoji" aria-hidden="true">
      {r}
    </span>
  );
}

/** Badges pinned to the message's top corner (opposite the tail). Several stack and overlap. */
export function Badges({ list, side, onOpen }: { list: Reaction[]; side: "left" | "right"; onOpen?: (el: HTMLElement) => void }) {
  const [now] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));
  // yours sits in front (iMessage); show at most three
  const ordered = [...list.filter((q) => q.by !== "me"), ...list.filter((q) => q.by === "me")].slice(-3);
  const label = `Reactions: ${list.map((q) => `${nameOf(q.by)} ${reactionVerb(q.r).replace(/ (at|to)$/, "")}`).join(", ")}. Show who reacted`;
  return (
    <button
      type="button"
      className={cx("mc-rxb", `mc-rxb--${side}`)}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.(e.currentTarget);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {ordered.map((q) => (
        <span
          key={`${q.by}-${q.r}`}
          className={cx("mc-rxg", q.by === "me" && "is-mine", !!q.at && now - q.at < 1500 && "is-fresh")}
        >
          <Glyph r={q.r} />
        </span>
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
  kind,
  side,
  label,
  lifted,
  reactions,
  onOpen,
  onWho,
  children,
}: {
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
      {!!reactions?.length && <Badges list={reactions} side={side === "left" ? "right" : "left"} onOpen={onWho} />}
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

const BAR_W = 302;
const BAR_H = 50;
const PICK_H = 300;
const MENU_H = 98;
const GAP = 8;
const EDGE = 12;

const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches;

export function ReactionLayer({
  slug,
  state,
  reactions,
  copyText,
  speaker,
  copy,
  onClose,
}: {
  slug: string;
  state: LayerState;
  reactions: Reaction[];
  /** The text Copy puts on the clipboard. */
  copyText: string;
  speaker: string;
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

  const pick = (key: string) => {
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
  const bottom = top + r.height + GAP + MENU_H + EDGE + (barAbove ? 0 : BAR_H + GAP);
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
          className={cx("mc-rxbar", !barAbove && "is-below", state.me && "is-me")}
          style={{ top: barTop, left: barLeft }}
          role="toolbar"
          aria-label={speaker === "You" ? "React to your message" : `React to ${speaker}'s message`}
          onKeyDown={onBarKey}
        >
          {TAPBACKS.map((t) => (
            <button key={t.key} type="button" className={cx("mc-rxbar__b", mine === t.key && "is-on")} aria-label={t.label} aria-pressed={mine === t.key} onClick={() => pick(t.key)}>
              <Glyph r={t.key} />
            </button>
          ))}
          <button
            type="button"
            className={cx("mc-rxbar__b mc-rxbar__more", mine && !tapbackOf(mine) && "is-on")}
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
                    <button key={em} type="button" className={cx(mine === em && "is-on")} aria-label={`React with ${em}`} aria-pressed={mine === em} onClick={() => pick(em)}>
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
