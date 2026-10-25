"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/features/console/components/chat/Composer";
import { EmptyThread, MessageFeed, prefersReducedMotion } from "@/features/console/components/chat/Messages";
import { PlanSheet } from "@/features/console/components/chat/PlanSheet";
import { PlanStrip } from "@/features/console/components/chat/Work";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { WorkspacePanel } from "@/features/console/components/panel/WorkspacePanel";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";
import { Replies } from "@/features/console/components/chat/Replies";
import {
  DEMO_SLUG,
  playDemo,
  resetDemo,
  setActiveThread,
  setDocFilter,
  setPanelTab,
  stageStory,
  stopDemo,
  togglePanel,
} from "@/features/console/demo/engine";
import { helperJobs } from "@/features/console/demo/seed";
import { findConversation, useDemo } from "@/features/console/demo/store";
import { useShell } from "@/features/console/hooks/use-shell";
import { useToast } from "@/features/console/hooks/use-toast";
import { isSoundOn, setSound } from "@/lib/sound";
import { cx } from "@/lib/cx";

/** One helper thread: iMessage-style feed in the Factory skin, docked composer, workspace panel. */
export function ThreadChat({ slug }: { slug: string }) {
  const conv = useDemo((s) => findConversation(s, slug));
  const typing = useDemo((s) => (s.typing?.slug === slug ? s.typing.who : null));
  const panelOpen = useDemo((s) => s.panel.open);
  const full = useDemo((s) => s.panel.full);
  const playing = useDemo((s) => s.playing);
  const sheetOpen = useDemo((s) => s.sheet?.slug === slug);
  const { toggleSidebar } = useShell();
  const host = useRef<HTMLDivElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const router = useRouter();
  const say = useToast();

  useEffect(() => {
    setActiveThread(slug);
    return () => setActiveThread(undefined);
  }, [slug]);

  /* keep the newest message in view, also while a reply streams in or chips appear (unless the owner scrolled up) */
  const count = conv?.messages.length ?? 0;
  const chips = conv?.replies?.length ?? 0;
  const stick = useRef(true);
  const autoUntil = useRef(0);
  useEffect(() => {
    const el = feed.current;
    if (!el) return;
    stick.current = true;
    autoUntil.current = Date.now() + 900;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() || count < 2 ? "auto" : "smooth" });
  }, [count, typing, chips]);
  useEffect(() => {
    const el = feed.current;
    const inner = el?.firstElementChild;
    if (!el || !inner) return;
    const onScroll = () => {
      if (Date.now() < autoUntil.current) return;
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    };
    const ro = new ResizeObserver(() => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    });
    ro.observe(inner);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [slug]);

  /* panel shortcuts: ⌘J computer, ⌥⌘S side chat, ⌘P docs, ⌘O files */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.code;
      if (k === "KeyJ" && !e.altKey) setPanelTab("Computer");
      else if (k === "KeyS" && e.altKey) setPanelTab("Side chat");
      else if (k === "KeyP" && !e.altKey) {
        setDocFilter("All");
        setPanelTab("Docs");
      } else if (k === "KeyO" && !e.altKey) {
        setDocFilter("By you");
        setPanelTab("Docs");
      } else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const off = (e: PointerEvent) => !(e.target as Element).closest(".mc-more") && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  if (!conv) {
    return (
      <section className="mc-empty-thread" aria-label="Thread">
        <EmptyThread helper="Mimi">This thread isn&apos;t in the demo any more.</EmptyThread>
        <Link className="mc-btn" href={consoleRoutes.home}>
          Start a new thread
        </Link>
      </section>
    );
  }

  const job = conv.helper === "Mimi" ? "Your whole team" : helperJobs[conv.helper];

  return (
    <div className={cx("mc-tv", panelOpen && "has-panel", full && panelOpen && "is-full")} ref={host}>
      <section className="mc-thread" aria-label={conv.title}>
        <header className="mc-hdr mc-hdr--title">
          <div className="mc-hdr__l">
            <button className="mc-gb mc-gb--icon mc-show-phone" type="button" aria-label="Open menu" onClick={toggleSidebar}>
              <Icon name="menu" />
            </button>
            <div className="mc-more mc-tt">
              <button
                type="button"
                className="mc-tt__b"
                aria-haspopup="menu"
                aria-expanded={menu}
                title={`${conv.helper} · ${job}`}
                onClick={() => setMenu(!menu)}
              >
                <span className="mc-tt__t">{conv.title}</span>
                <Icon name="chevron-down" className="i mc-tt__c" />
              </button>
              <p className="mc-tt__s" aria-live="polite">
                <HelperFace name={conv.helper} size={14} />
                <span className="mc-tt__h">{conv.helper}</span>
                {conv.working && <i className="mc-spin" aria-hidden="true" />}
                <span key={conv.status} className="mc-tt__st">
                  {typing && typing !== "me" ? `${typing} is working` : conv.status}
                </span>
              </p>
              {menu && (
            <div className="mc-menu mc-menu--l" role="menu">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(false);
                  void playDemo((h) => router.push(h));
                }}
              >
                <Icon name="play" />
                Play demo
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(false);
                  stageStory();
                  router.push(`${consoleRoutes.threads}/${DEMO_SLUG}`);
                }}
              >
                <Icon name="list-checks" />
                Walk through with chips
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(false);
                  resetDemo();
                  say("Demo reset to the start");
                }}
              >
                <Icon name="refresh-cw" />
                Reset demo
              </button>
              <hr />
              <button role="menuitem" type="button" onClick={() => (setMenu(false), setPanelTab("Side chat"))}>
                <Icon name="message-square" />
                Side chat
              </button>
              <button role="menuitem" type="button" onClick={() => (setMenu(false), setPanelTab("Docs"))}>
                <Icon name="file-text" />
                Docs
              </button>
              {conv.helper === "Credit" && (
                <Link role="menuitem" href={consoleRoutes.credit} onClick={() => setMenu(false)}>
                  <Icon name="landmark" />
                  Credit limits
                </Link>
              )}
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenu(false);
                  setSound(!isSoundOn());
                }}
              >
                <Icon name="zap" />
                Sound on or off
              </button>
            </div>
              )}
            </div>
          </div>
          <div className="mc-hdr__r">
            {playing && (
              <button type="button" className="mc-gb mc-gb--live" onClick={stopDemo}>
                <i className="mc-dot" aria-hidden="true" />
                <span className="mc-hide-phone">Stop demo</span>
              </button>
            )}
            <button
              type="button"
              className={cx("mc-gb mc-gb--icon", panelOpen && "is-on")}
              aria-pressed={panelOpen}
              aria-label="Workspace panel"
              onClick={togglePanel}
            >
              <Icon name="panel-right-open" />
            </button>
            <Link className="mc-btn mc-btn--pri mc-new" href={`${consoleRoutes.home}#new`} aria-label="New thread">
              <Icon name="plus" />
              <span className="mc-new__t">New</span>
            </Link>
          </div>
        </header>
        <div className="mc-feed" ref={feed}>
          <div className="mc-col mc-fi">
            {conv.messages.length === 0 && !typing ? (
              <EmptyThread helper={conv.helper} />
            ) : (
              <MessageFeed slug={slug} messages={conv.messages} typing={typing} />
            )}
            <Replies slug={slug} />
          </div>
        </div>
        <PlanStrip slug={slug} />
        <Composer slug={slug} helper={conv.helper} />
        {sheetOpen && <PlanSheet />}
      </section>
      <WorkspacePanel slug={slug} host={host} />
    </div>
  );
}
