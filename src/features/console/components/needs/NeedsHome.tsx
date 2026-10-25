"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import { approveCard, conversationHref, declineCard, startThread } from "@/features/console/demo/engine";
import { needItems, type NeedItem } from "@/features/console/demo/needs";
import { owner } from "@/features/console/demo/seed";
import { useDemo } from "@/features/console/demo/store";
import { cx } from "@/lib/cx";

const VISIBLE = 4;
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;
const noop = () => () => {};
const part = () => {
  const h = new Date().getHours();
  return h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
};

function Row({ it }: { it: NeedItem }) {
  const sending = it.status === "sending";
  return (
    <li className={cx("mc-nr", sending && "is-sending")}>
      <HelperFace name={it.helper} size={32} />
      <Link className="mc-nr__tx" href={conversationHref(it.conv)}>
        <span className="mc-nr__what">
          {it.what}
          {it.amount !== undefined && <b> · {naira(it.amount)}</b>}
        </span>
        <small className="mc-nr__why">
          {it.shop && !/^\d+ shops$|manager|Dufil|Hypo|Peak|Indomie/i.test(it.shop) && <ShopAvatar name={it.shop} size={20} className="mc-nr__shop" />}
          {[it.shop, it.why].filter(Boolean).join(" · ") || it.helper}
        </small>
      </Link>
      <div className="mc-nr__act">
        {sending ? (
          <span className="mc-nr__st mc-mono" role="status">
            <i className="mc-spin" aria-hidden="true" />
            Approving
          </span>
        ) : (
          <>
            <button type="button" className="mc-ib mc-nr__x" aria-label={`Decline: ${it.what}`} onClick={() => declineCard(it.slug, it.messageId)}>
              <Icon name="x" />
            </button>
            <Link className="mc-btn mc-nr__open" href={conversationHref(it.conv)} aria-label={`Open the ${it.helper} thread`}>
              Open
            </Link>
            <button type="button" className="mc-btn mc-btn--pri mc-nr__ok" onClick={() => approveCard(it.slug, it.messageId)}>
              Approve
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/** /console: one calm pile of everything waiting on the owner, and the composer that starts a thread. */
export function NeedsHome() {
  const router = useRouter();
  const conversations = useDemo((s) => s.conversations);
  const items = useMemo(() => needItems(conversations), [conversations]);
  const when = useSyncExternalStore(noop, part, () => "Morning");
  const [all, setAll] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (window.location.hash === "#new") input.current?.focus();
  }, []);

  const waiting = items.filter((i) => i.status === "needs").length;
  const busy = [...new Set(conversations.filter((c) => c.working).map((c) => c.helper))].slice(0, 2);
  const shown = all ? items : items.slice(0, VISIBLE);

  function go() {
    if (!text.trim()) return;
    const slug = startThread(text);
    setText("");
    router.push(`/console/threads/new?id=${slug}`);
  }

  return (
    <div className="mc-nh">
      <div className="mc-nh__scroll">
        <div className="mc-col mc-nh__in">
          <h1 className="mc-nh__hi">
            {items.length
              ? `${when}, ${owner.first}. ${waiting} thing${waiting === 1 ? "" : "s"} need${waiting === 1 ? "s" : ""} you.`
              : `All clear, ${owner.first}.${busy.length ? ` ${busy.join(" and ")} ${busy.length > 1 ? "are" : "is"} working.` : ""}`}
          </h1>
          {items.length > 0 && (
            <section aria-label="Needs you">
              <ul className="mc-nl">
                {shown.map((it) => (
                  <Row key={it.key} it={it} />
                ))}
              </ul>
              {items.length > VISIBLE && (
                <button type="button" className="mc-nl__more" aria-expanded={all} onClick={() => setAll(!all)}>
                  {all ? "Show less" : `Show all ${items.length}`}
                  <Icon name="chevron-down" />
                </button>
              )}
            </section>
          )}
        </div>
      </div>
      <form
        className="mc-col mc-nh__cmp"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <div className="mc-pill">
          <textarea
            ref={input}
            rows={1}
            value={text}
            aria-label="Ask Mimi"
            placeholder="Ask Mimi anything"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                go();
              }
            }}
          />
          <button type="submit" className="mc-snd" aria-label="Start thread" disabled={!text.trim()}>
            <Icon name="arrow-up" />
          </button>
        </div>
      </form>
    </div>
  );
}
