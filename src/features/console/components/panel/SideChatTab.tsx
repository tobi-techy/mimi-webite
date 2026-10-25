"use client";

import { useEffect, useRef, useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { RichText } from "@/features/console/components/chat/Messages";
import { Icon } from "@/features/console/components/ui/Icon";
import { clock, sideSend } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import { cx } from "@/lib/cx";

/** A private side conversation with Mimi that stays out of the thread. */
export function SideChatTab() {
  const side = useDemo((s) => s.side);
  const typing = useDemo((s) => s.sideTyping);
  const [text, setText] = useState("");
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [side.length, typing]);

  function send() {
    if (!text.trim()) return;
    sideSend(text);
    setText("");
  }

  return (
    <div className="mc-sc">
      <div className="mc-scn">
        <HelperFace name="Mimi" size={14} ring={22} />
        <span>
          <span className="mc-ink">Side chat with Mimi</span> · stays out of this thread
        </span>
      </div>
      <div className="mc-scf" ref={feed} aria-live="polite">
        <p className="mc-ts mc-mono">{side[0] ? clock(new Date(side[0].at)) : ""}</p>
        {side.map((m, i) => (
          <div key={m.id} className={cx("mc-sb", m.from === "me" && "is-me", side[i + 1]?.from !== m.from && "is-tail")}>
            {m.quote && <div className="mc-qt">{m.quote}</div>}
            <RichText text={m.text} />
          </div>
        ))}
        {typing && (
          <div className="mc-typ mc-typ--side" role="status" aria-label="Mimi is typing">
            <i />
            <i />
            <i />
          </div>
        )}
      </div>
      <form
        className="mc-scc"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="mc-pill">
          <textarea
            rows={1}
            value={text}
            aria-label="Ask on the side"
            placeholder="Ask on the side"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" className="mc-snd" aria-label="Send" disabled={!text.trim()}>
            <Icon name="arrow-up" />
          </button>
        </div>
      </form>
    </div>
  );
}
