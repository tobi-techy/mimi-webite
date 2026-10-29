"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/features/console/components/chat/Composer";
import { DateLine, EmptyThread, MessageFeed, prefersReducedMotion } from "@/features/console/components/chat/Messages";
import { PlanSheet } from "@/features/console/components/chat/PlanSheet";
import { Waiting } from "@/features/console/components/chat/Waiting";
import { PlanStrip, goToCard } from "@/features/console/components/chat/Work";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { WorkspacePanel } from "@/features/console/components/panel/WorkspacePanel";
import { useLive } from "@/features/console/api/live-store";
import { SkeletonFeed } from "@/features/console/components/live/Skeleton";
import { LiveDemoNote } from "@/features/console/components/live/LiveDemoNote";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes, helperHref } from "@/features/console/config";
import { Replies } from "@/features/console/components/chat/Replies";
import {
  DEMO_SLUG,
  openPanel,
  playDemo,
  resetDemo,
  setActiveThread,
  setDocFilter,
  setPanelTab,
  stageStory,
  stopDemo,
  togglePanel,
} from "@/features/console/demo/engine";
import { dayLabel, helperSections, rosterRow } from "@/features/console/demo/roster";
import { helperJobs } from "@/features/console/demo/seed";
import type { Conversation, Speaker } from "@/features/console/demo/types";
import { findConversation, useDemo } from "@/features/console/demo/store";
import { useShell } from "@/features/console/hooks/use-shell";
import { useToast } from "@/features/console/hooks/use-toast";
import { isSoundOn, setSound } from "@/lib/sound";
import { cx } from "@/lib/cx";

/** Demo setup progress: WhatsApp, Sheets and Paystack connected; shops import and team invite left. */
const SETUP_DONE = 3;
const SETUP_STEPS = 5;

/**
 * Setup progress, at the top of Mimi's conversation (it used to sit in the sidebar). The live demo
 * has nothing to set up (it is a ready-made copy), so there it points at the demo's shops instead.
 */
function GettingStarted() {
  const status = useLive((s) => s.status);
  const shops = useLive((s) => s.shops);
  if (status === "connecting") return null;
  if (status === "ready")
    return (
      <Link href={consoleRoutes.shops} className="mc-gs mc-gs--feed" aria-label={`Explore the demo: ${shops?.length ?? 0} made-up shops`}>
        <Icon name="store" />
        <span className="mc-gs__t">Explore the demo</span>
        <span className="mc-gs__k">{shops?.length ?? 0} made-up shops</span>
        <Icon name="chevron-right" />
      </Link>
    );
  return (
    <Link
      href={`${consoleRoutes.settings}/connectors`}
      className="mc-gs mc-gs--feed"
      aria-label={`Getting started, ${SETUP_DONE} of ${SETUP_STEPS} done`}
    >
      <svg className="mc-gs__ring" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" />
        <circle
          cx="8"
          cy="8"
          r="6.25"
          pathLength="100"
          strokeDasharray={`${(SETUP_DONE / SETUP_STEPS) * 100} 100`}
          transform="rotate(-90 8 8)"
        />
      </svg>
      <span className="mc-gs__t">Getting started</span>
      <span className="mc-gs__k">
        {SETUP_DONE} of {SETUP_STEPS} done
      </span>
      <Icon name="chevron-right" />
    </Link>
  );
}

const labelOf = (c: Conversation) => {
  const first = c.messages[0];
  return first?.kind === "date" ? first.label : dayLabel(c.ago);
};

/**
 * One task inside a helper's conversation: a date line (skipped when it repeats the one above),
 * a centred "New task" event, then the task's messages. Cards, polls and chips act on this task.
 */
function TaskSection({
  c,
  open,
  prevLabel,
  typing,
}: {
  c: Conversation;
  open: boolean;
  prevLabel?: string;
  typing: Speaker | null;
}) {
  const label = labelOf(c);
  const rest = c.messages[0]?.kind === "date" ? c.messages.slice(1) : c.messages;
  return (
    <div className={cx("mc-task", open && "is-open")} id={`task-${c.slug}`} data-task={c.slug}>
      {label !== prevLabel && <DateLine label={label} />}
      <p className="mc-ev mc-ev--task" role="note">
        New task · {c.title}
      </p>
      {rest.length === 0 && !typing ? (
        open ? (
          <EmptyThread helper={c.helper} />
        ) : null
      ) : (
        <MessageFeed slug={c.slug} messages={rest} typing={typing} />
      )}
    </div>
  );
}

/** A helper's one conversation: iMessage-style feed of her tasks in the Factory skin, docked composer (on the open task), workspace panel. */
export function ThreadChat({ slug }: { slug: string }) {
  const conv = useDemo((s) => findConversation(s, slug));
  const typing = useDemo((s) => (s.typing?.slug === slug ? s.typing.who : null));
  const typingAny = useDemo((s) => s.typing);
  const conversations = useDemo((s) => s.conversations);
  const panelOpen = useDemo((s) => s.panel.open);
  const full = useDemo((s) => s.panel.full);
  const playing = useDemo((s) => s.playing);
  const computer = useDemo((s) => s.computer);
  const sheetOpen = useDemo((s) => s.sheet?.slug === slug);
  const liveStatus = useLive((s) => s.status);
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
  /* the whole conversation (every task of this helper) */
  const count = conversations.reduce((n, c) => (c.helper === conv?.helper ? n + c.messages.length : n), 0);
  const chips = conv?.replies?.length ?? 0;
  const stick = useRef(true);
  const autoUntil = useRef(0);
  /* scrolled up: new messages do not pull the owner down; a pill offers the jump instead */
  const [away, setAway] = useState(false);
  const last = conv?.messages.at(-1);
  const mineLast = !!last && last.kind === "text" && last.from === "me";
  useEffect(() => {
    const el = feed.current;
    if (!el) return;
    if (!stick.current && !mineLast) return;
    stick.current = true;
    autoUntil.current = Date.now() + 900;
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() || count < 2 ? "auto" : "smooth" });
  }, [count, typing, chips, mineLast]);
  /* opened on one card (Mimi's roll-up links to …#m-<card>): show that card instead of the newest message */
  useEffect(() => {
    const id = /^#m-(.+)$/.exec(window.location.hash)?.[1];
    if (!id) return;
    const t = window.setTimeout(() => {
      if (!document.getElementById(`m-${id}`)) return;
      stick.current = false;
      autoUntil.current = 0;
      goToCard(decodeURIComponent(id));
    }, 120);
    return () => window.clearTimeout(t);
  }, [slug]);
  useEffect(() => {
    const el = feed.current;
    const inner = el?.firstElementChild;
    if (!el || !inner) return;
    /* only the reader moving up lets go of the bottom (our own scrolls only ever go down): a smooth
       scroll still on its way, or content growing under it (a long reply revealing, an image
       loading), never does. Back near the bottom, it holds on again */
    let lastTop = el.scrollTop;
    const onScroll = () => {
      const top = el.scrollTop;
      const up = top < lastTop - 2;
      lastTop = top;
      const near = el.scrollHeight - top - el.clientHeight < 96;
      if (near) stick.current = true;
      else if (up) stick.current = false;
      else if (Date.now() < autoUntil.current) return;
      setAway(!stick.current);
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
    if (liveStatus === "connecting")
      return (
        <div className="mc-tv">
          <section className="mc-thread" aria-label="Thread" aria-busy="true">
            <div className="mc-feed">
              <div className="mc-col mc-fi">
                <SkeletonFeed />
              </div>
            </div>
          </section>
        </div>
      );
    return (
      <section className="mc-empty-thread" aria-label="Thread">
        <EmptyThread helper="Mimi">This thread isn&apos;t in the demo any more.</EmptyThread>
        <Link className="mc-btn" href={consoleRoutes.newThread}>
          Start a new thread
        </Link>
      </section>
    );
  }

  const job = conv.helper === "Mimi" ? "Your whole team" : helperJobs[conv.helper];
  /* the header face follows the helper's real state: working while a task runs, waiting on an approval, a done pop when it finishes */
  const face = rosterRow({ conversations, typing: typingAny, computer }, conv.helper);
  /* one conversation per helper: every task she has worked on, the open one last */
  const sections = helperSections(conversations, conv.helper, slug);
  /* computer level 1: a live status line in the header while the panel is closed */
  const compActive = computer.status === "live" || computer.status === "paused" || computer.status === "user";
  /* the Computer panel is sample data: its live chip never shows on a thread from the API */
  const compHere = !conv.api && compActive && (computer.helper === conv.helper || conv.messages.some((m) => m.kind === "computer" || ("from" in m && m.from === computer.helper)));

  return (
    <div className={cx("mc-tv", panelOpen && "has-panel", full && panelOpen && "is-full")} ref={host}>
      <section className="mc-thread" aria-label={`${conv.helper}: conversation`}>
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
                <HelperFace name={conv.helper} size={28} state={face.state} dot={face.needs > 0} />
                <span className="mc-tt__t">{conv.helper}</span>
                <Icon name="chevron-down" className="i mc-tt__c" />
              </button>
              <p className="mc-tt__s" aria-live="polite">
                <span className="mc-tt__h mc-tt__job">{job}</span>
                {conv.working && <i className="mc-spin" aria-hidden="true" />}
                <span key={conv.status} className="mc-tt__st">
                  {(typing && typing !== "me") || conv.status === "typing" ? "writing the reply" : conv.status}
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
              <Link role="menuitem" href={helperHref(conv.helper)} onClick={() => setMenu(false)}>
                <Icon name="calendar-clock" />
                {conv.helper}&apos;s routines
              </Link>
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
            {compHere && !panelOpen && (
              <button
                type="button"
                className="mc-cdot"
                onClick={() => openPanel("Computer")}
                aria-label={`${computer.helper} is ${computer.status === "user" ? "paused, you have the computer" : "using the computer"}: ${computer.activity}. Open the computer`}
              >
                <i className={cx("mc-dot", computer.status === "paused" && "is-off")} aria-hidden="true" />
                <Icon name="monitor" />
                <span className="mc-cdot__t mc-hide-phone">
                  {computer.status === "user" ? "You have the computer" : computer.activity}
                </span>
              </button>
            )}
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
            <Link className="mc-gb mc-gb--icon mc-hide-phone" href={helperHref(conv.helper)} aria-label={`${conv.helper}'s routines and cost`} title={`${conv.helper}'s routines and cost`}>
              <Icon name="calendar-clock" />
            </Link>
            <Link
              className="mc-btn mc-btn--pri mc-new"
              href={consoleRoutes.home}
              aria-label="New: ask Mimi"
              title="Ask Mimi to start something new"
              onClick={(e) => {
                if (conv.helper !== "Mimi") return;
                e.preventDefault();
                document.querySelector<HTMLTextAreaElement>(".mc-cmp textarea")?.focus();
              }}
            >
              <Icon name="plus" />
              <span className="mc-new__t">New</span>
            </Link>
          </div>
        </header>
        <div className="mc-feed" ref={feed}>
          <div className="mc-col mc-fi">
            {conv.helper === "Mimi" && <GettingStarted />}
            {conv.helper === "Mimi" && <LiveDemoNote />}
            {sections.map((c, i) => (
              <TaskSection
                key={c.slug}
                c={c}
                open={c.slug === slug}
                prevLabel={i > 0 ? labelOf(sections[i - 1]!) : undefined}
                typing={typingAny?.slug === c.slug ? typingAny.who : null}
              />
            ))}
            {conv.helper === "Mimi" && <Waiting />}
            <Replies slug={slug} />
          </div>
        </div>
        <PlanStrip slug={slug} />
        <div className="mc-jump-host">
          {away && (
            <button
              type="button"
              className="mc-btn mc-jump"
              onClick={() => {
                const el = feed.current;
                if (!el) return;
                stick.current = true;
                setAway(false);
                el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
              }}
            >
              <Icon name="chevron-down" />
              Jump to latest
            </button>
          )}
          <Composer slug={slug} helper={conv.helper} />
        </div>
        {sheetOpen && <PlanSheet />}
      </section>
      <WorkspacePanel slug={slug} host={host} />
    </div>
  );
}
