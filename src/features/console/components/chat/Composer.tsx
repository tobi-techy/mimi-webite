"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { consoleRoutes } from "@/features/console/config";
import { fileInvoice, sendMessage, sendPhoto, sendVoice } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";

type PlusItem = { icon: IconName; label: string; run: () => void };

/** The docked pill composer: + menu, text, mic (voice note) and send. */
export function Composer({ slug, helper }: { slug: string; helper: string }) {
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [rec, setRec] = useState(0);
  const draft = useDemo((s) => (s.draft?.slug === slug ? s.draft.text : null));
  const playing = useDemo((s) => s.playing);
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

  const value = draft ?? text;

  function send() {
    if (!value.trim() || playing) return;
    sendMessage(slug, value);
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
      <div className={cx("mc-pill", rec > 0 && "is-rec")}>
        {rec > 0 ? (
          <span className="mc-pill__rec mc-mono" role="status">
            <i /> Recording 0:{String(rec - 1).padStart(2, "0")} · tap the mic to send
          </span>
        ) : (
          <textarea
            ref={input}
            rows={1}
            value={value}
            readOnly={draft !== null}
            aria-label={`Message ${helper}`}
            placeholder={`Message ${helper}`}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
          />
        )}
        <button type="button" className={cx("mc-mic", rec > 0 && "is-on")} aria-label={rec ? "Send voice note" : "Record a voice note"} onClick={mic}>
          <Icon name="mic" />
        </button>
        <button type="button" className="mc-snd" aria-label="Send" disabled={!value.trim()} onClick={send}>
          <Icon name="arrow-up" />
        </button>
      </div>
    </div>
  );
}
