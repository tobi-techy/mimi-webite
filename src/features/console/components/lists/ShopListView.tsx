"use client";

import { useState, type CSSProperties } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { findShopList, listStatusLabel, type ListShopReply } from "@/features/console/content/shop-lists";
import { useToast } from "@/features/console/hooks/use-toast";
import { avatarFor } from "@/features/console/lib/avatar";
import { cx } from "@/lib/cx";

const naira = (n: number) => `₦${n.toLocaleString("en-US")}`;

/** A shop's round initials avatar (people and shops are round; helpers are their own mark). */
export function InitialsAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const a = avatarFor(name);
  return (
    <span className="mf-av" aria-hidden="true" style={{ "--av": a.tint, "--s": `${size}px` } as CSSProperties}>
      {a.initials}
    </span>
  );
}

/** The dashed round count a shop list wears in the sidebar and its own header. */
export function ListBadge({ count, size = 36 }: { count: number; size?: number }) {
  return (
    <span className="mf-lb" aria-hidden="true" style={{ "--s": `${size}px` } as CSSProperties}>
      {count}
    </span>
  );
}

function Lock() {
  return (
    <svg className="mf-lock" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

function Row({ r }: { r: ListShopReply }) {
  return (
    <li className="mf-lr">
      <InitialsAvatar name={r.shop} />
      <span className="mf-lr__n">{r.shop}</span>
      <span className={cx("mf-lr__t", !r.quoted && "is-receipt")}>{r.quoted ? `“${r.reply}”` : r.reply}</span>
      <span className={cx("mf-pill", r.status === "ordered" && "is-ok", r.status === "none" && "is-dim")}>{listStatusLabel(r)}</span>
      <span className="mf-lr__lock" title="Private: only this shop sees it">
        <Lock />
      </span>
    </li>
  );
}

/**
 * One shop list (/lists/[id]): who is on it, the message that went out, how it landed (four quiet
 * stat tiles) and each shop's private reply. Demo data. "New message" opens a plain compose box.
 */
export function ShopListView({ id }: { id: string }) {
  const list = findShopList(id);
  const say = useToast();
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  if (!list) return null;
  const s = list.stats;
  const stats = [
    { label: "Delivered", value: `${s.delivered} of ${list.count}`, helper: "Brand" as const },
    { label: "Read", value: String(s.read), helper: "Proof" as const },
    { label: "Replied", value: String(s.replied), helper: "Collector" as const },
    { label: "Orders", value: naira(s.ordersNaira), helper: "Order" as const },
  ];
  return (
    <div className="mf-list">
      <div className="mf-top">
        <span className="mf-k">Shop list</span>
        <span className="mc-grow" />
        <button type="button" className="mf-btn" onClick={() => say("Editing shops is coming to the demo soon")}>
          Edit shops
        </button>
        <button type="button" className="mf-btn mf-btn--pri" onClick={() => setComposing((c) => !c)} aria-expanded={composing}>
          New message
        </button>
      </div>

      <div className="mf-scroll">
        <header className="mf-head">
          <ListBadge count={list.count} size={52} />
          <h1>{list.name}</h1>
          <p>{list.count} shops · each one gets it privately, replies come back here</p>
        </header>

        {composing && (
          <form
            className="mf-compose"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              say(`Demo: ${list.sentBy} would send this to ${list.count} shops, one by one`);
              setDraft("");
              setComposing(false);
            }}
          >
            <label className="mf-k" htmlFor="mf-draft">
              To {list.count} shops, privately
            </label>
            <textarea id="mf-draft" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write one message. Each shop gets its own copy." autoFocus />
            <div className="mf-compose__a">
              <button type="button" className="mf-btn" onClick={() => setComposing(false)}>
                Cancel
              </button>
              <button type="submit" className="mf-btn mf-btn--pri" disabled={!draft.trim()}>
                Send to {list.count} shops
              </button>
            </div>
          </form>
        )}

        <div className="mf-sent">
          <p className="mf-sent__b">{list.message}</p>
          <p className="mf-hand">
            <HelperFace name={list.sentBy} size={16} quiet still />
            <b>{list.sentBy}</b> sent it to {list.count} shops at {list.sentAt} · one by one, never as a group
          </p>
        </div>

        <ul className="mf-stats" aria-label="How it landed">
          {stats.map((t) => (
            <li key={t.label}>
              <span className="mf-stats__l">
                <HelperFace name={t.helper} size={18} quiet still />
                {t.label}
              </span>
              <span className="mf-stats__n">{t.value}</span>
            </li>
          ))}
        </ul>

        <ul className="mf-rows" aria-label="Replies">
          {list.replies.map((r) => (
            <Row key={r.shop} r={r} />
          ))}
        </ul>
      </div>
    </div>
  );
}
