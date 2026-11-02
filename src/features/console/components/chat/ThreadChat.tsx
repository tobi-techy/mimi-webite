"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Composer } from "@/features/console/components/chat/Composer";
import { EmptyThread, MessageFeed, prefersReducedMotion } from "@/features/console/components/chat/Messages";
import { PlanSheet } from "@/features/console/components/chat/PlanSheet";
import { MemorySheet, StepsSheet, TaskSheet, taskWord } from "@/features/console/components/chat/QuietSheets";
import { PlanStrip, goToCard } from "@/features/console/components/chat/Work";
import { HelperBrief } from "@/features/console/components/helpers/HelperBrief";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { WorkspacePanel } from "@/features/console/components/panel/WorkspacePanel";
import { markViewed, setFocus, useLive } from "@/features/console/api/live-store";
import { asksIn, assignFor, borrowedChat, ownChat } from "@/features/console/lib/chat-view";
import { NeedsYou } from "@/features/console/components/chat/Ask";
import { SkeletonFeed } from "@/features/console/components/live/Skeleton";
import { LiveDemoNote } from "@/features/console/components/live/LiveDemoNote";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes, consoleThread, helperHref } from "@/features/console/config";
import { needItems } from "@/features/console/demo/needs";
import { liveWork, statusLine, taskState, taskStateLabel, updatedBy } from "@/features/console/lib/thread-view";
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
import { dayLabel, helperSections, rosterNames, rosterRow, type RosterName } from "@/features/console/demo/roster";
import { helperJobs } from "@/features/console/demo/seed";
import type { Conversation, HelperName, Message, Speaker, Worker } from "@/features/console/demo/types";
import { findConversation, useDemo } from "@/features/console/demo/store";
import { useShell } from "@/features/console/hooks/use-shell";
import { useToast } from "@/features/console/hooks/use-toast";
import { isSoundOn, setSound } from "@/lib/sound";
import { cx } from "@/lib/cx";
import { consoleMotion } from "@/config/console-motion";

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

/** Live demo: under an ask answered in Mimi's chat, the helper's chat says Mimi passed it on. */
function passedOn(lines: Message[], answers: Readonly<Record<string, { via: string }>>): Message[] {
  const out: Message[] = [];
  for (const m of lines) {
    out.push(m);
    if (m.kind === "ask" && answers[m.id]?.via === "mimi") out.push({ id: `${m.id}:passed`, kind: "event", text: `Mimi passed your answer to ${m.from}`, at: m.at });
  }
  return out;
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
  onTask,
  quiet,
  focus,
  lines,
  from,
}: {
  c: Conversation;
  /** Live demo: this helper's chat out of the shared thread (what she was asked, and her work). */
  focus?: RosterName;
  /** The lines to show (her own chat, or what was handed to her), worked out by the caller. */
  lines: Message[];
  /** A task another helper handed over: whose conversation it came from. */
  from?: Worker;
  open: boolean;
  /** Mimi's conversation: a task that waits on you reads "Waiting", no orange mark (the header carries the one count). */
  quiet?: boolean;
  prevLabel?: string;
  typing: Speaker | null;
  /** Opens this task's own thread (fresh context). */
  onTask: (slug: string) => void;
}) {
  const label = labelOf(c);
  /* the task line already carries the day */
  const rest = lines[0]?.kind === "date" ? lines.slice(1) : lines;
  /* live demo: the shared thread reads as "You and Collector" in her chat */
  const title = focus && c.api ? `You and ${focus}` : from ? `From ${from}: ${c.title}` : c.title;
  const by = updatedBy(c);
  const st = taskState(c);
  const word = quiet && st === "needs" ? taskStateLabel.waiting : taskWord(c);
  return (
    <div className={cx("mc-task", open && "is-open")} id={`task-${c.slug}`} data-task={c.slug}>
      {/* each long job reads as one quiet muted line: the date (when it changes) and the title, nothing else.
          State, proof and "updated by" live in the task's own thread (TaskSheet) and the Steps sheet. */}
      <button
        type="button"
        className="mc-ev mc-ev--task mc-taskln"
        aria-haspopup="dialog"
        aria-label={`${label !== prevLabel ? `${label}. ` : ""}${title}. ${word}${by ? `, updated by ${by} ${c.ago} ago` : ""}. Open the task`}
        onClick={() => onTask(c.slug)}
      >
        {label !== prevLabel && <span className="mc-taskln__d">{label}</span>}
        <span className="mc-taskln__t">{title}</span>
      </button>
      {rest.length === 0 && !typing ? (
        open ? (
          focus ? <EmptyThread helper={focus}>Nothing here yet. Ask {focus} anything below.</EmptyThread> : <EmptyThread helper={c.helper} />
        ) : null
      ) : (
        <MessageFeed slug={c.slug} messages={rest} typing={typing} />
      )}
    </div>
  );
}

/** A helper's one conversation: iMessage-style feed of her tasks in the Factory skin, docked composer (on the open task), workspace panel. */
export function ThreadChat({ slug, focus: focusIn }: { slug: string; focus?: RosterName }) {
  const conv = useDemo((s) => findConversation(s, slug));
  const typing = useDemo((s) => (s.typing?.slug === slug ? s.typing.who : null));
  const typingAny = useDemo((s) => s.typing);
  const conversations = useDemo((s) => s.conversations);
  const panelOpen = useDemo((s) => s.panel.open);
  const full = useDemo((s) => s.panel.full);
  const playing = useDemo((s) => s.playing);
  const computer = useDemo((s) => s.computer);
  const sheetOpen = useDemo((s) => s.sheet?.slug === slug);
  /* quiet sheets: Steps (from the status line), a task's own thread, What I remember */
  const [quiet, setQuiet] = useState<{ kind: "steps" | "memory" } | { kind: "task"; slug: string } | null>(null);
  const liveStatus = useLive((s) => s.status);
  const answers = useLive((s) => s.answers);
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

  /* live demo: one helper's side of the shared thread (her sidebar row was tapped) */
  const focus = focusIn && conv?.api && conv.helper !== focusIn ? focusIn : undefined;
  useEffect(() => {
    setFocus(focus ?? null);
    return () => setFocus(null);
  }, [focus]);
  /* what is on screen counts as read: that helper's side, or the whole shared thread */
  const msgCount = conv?.messages.length ?? 0;
  useEffect(() => {
    if (!conv?.api) return;
    markViewed(focus ? [focus] : rosterNames);
  }, [conv?.api, focus, msgCount]);

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

  /* soft settle the first time a message scrolls into view (Tobi, 29 Oct 2026). Native scrolling is
     untouched: an IntersectionObserver only tags a group once, and CSS plays one short transform.
     Messages already on screen, new ones (they have their own spring) and anything passed during our
     own scroll to the bottom are marked seen without moving */
  const seen = useRef<WeakSet<Element>>(new WeakSet());
  useEffect(() => {
    const el = feed.current;
    if (!el || !consoleMotion.scrollSettle || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    let primed = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const g = e.target;
          io.unobserve(g);
          if (seen.current.has(g)) continue;
          seen.current.add(g);
          if (primed && Date.now() >= autoUntil.current) g.setAttribute("data-settle", "");
        }
        primed = true;
      },
      { root: el },
    );
    el.querySelectorAll(".mc-grp").forEach((g) => {
      if (seen.current.has(g)) return;
      if (g.classList.contains("mc-in")) seen.current.add(g);
      else io.observe(g);
    });
    return () => io.disconnect();
  }, [slug, count]);

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
    /* home with no chat to open (the demo API turned this visitor away): say so plainly, no dead end */
    if (!slug)
      return (
        <section className="mc-empty-thread" aria-label="Thread">
          <EmptyThread helper="Mimi">Mimi&apos;s chat can&apos;t open right now. You can still look around the demo.</EmptyThread>
          <Link className="mc-btn" href={consoleRoutes.shops}>
            See the shops
          </Link>
        </section>
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

  /* who the header shows: the thread's helper, or the helper whose side is open */
  const who = focus ?? conv.helper;
  const job = who === "Mimi" ? "Your whole team" : helperJobs[who];
  /* Grok Bot reading: the header carries what the helper is doing in one line ("Checking Ikeja payments…"),
     taken from the live work line the thread no longer shows */
  /* live demo: the shared thread is busy for whichever chat sent the newest message; the others stay quiet */
  const lastSent = [...conv.messages].reverse().find((m): m is Extract<Message, { kind: "text" }> => m.kind === "text" && m.from === "me");
  const busyHere = !conv.api || (lastSent?.to ?? "Mimi") === who;
  const live = consoleThread.showWork || !busyHere ? null : liveWork(conv.messages);
  const writing = busyHere && ((typing && typing !== "me") || conv.status === "typing");
  /* one state for the open task: Working / Waiting / Needs you / Stuck / Done next to the status */
  const isMimi = conv.helper === "Mimi";
  /* Mimi's thread carries no "Needs you" state word: the one quiet "N waiting" link below stands for the pile */
  const tstateRaw = taskState(conv);
  const tstate = isMimi && tstateRaw === "needs" ? "waiting" : tstateRaw;
  /* ONE short item in the status line, never stacked (Tobi, 29 Oct 2026: "threads are too crowded"):
     "Needs you" when something waits, else the working status, else nothing. The role lives in the name menu. */
  const statusText =
    tstate === "needs" || tstate === "stuck"
      ? taskStateLabel[tstate]
      : live
        ? statusLine(live, "")
        : writing
          ? "Writing the reply…"
          : tstate === "working"
            ? conv.status || taskStateLabel.working
            : "";
  /* the back pill's badge: things waiting on you in other threads (the console has no unread count) */
  const needs = needItems(conversations).filter((n) => n.status === "needs");
  /* in Mimi's thread the back badge would repeat the waiting count, so it stays off there */
  const elsewhere = isMimi ? 0 : needs.filter((n) => n.conv.slug !== slug).length;
  /* Mimi's one quiet indicator: an orange dot and a muted "N waiting" in the status line, opening the pile */
  const waitingAll = isMimi ? needs.length : 0;
  /* the header face follows the helper's real state: working while a task runs, waiting on an approval, a done pop when it finishes */
  const face = rosterRow({ conversations, typing: typingAny, computer }, conv.helper);
  /* one conversation per helper: every task she has worked on, the open one last, each read as her
     own chat (work she handed over folds into one line). Live: the shared thread seen as `who`'s chat */
  const own = helperSections(conversations, conv.helper, slug).map((c) => ({
    c,
    lines: c.api ? (focus ? passedOn(borrowedChat(c.messages, focus as HelperName), answers) : ownChat(c.messages, "Mimi")) : ownChat(c.messages, c.helper),
    from: undefined as Worker | undefined,
  }));
  /* sample threads: what other helpers handed to her lives here too, as its own task */
  const borrowed =
    conv.api || who === "Mimi"
      ? []
      : conversations
          .filter((c) => c.helper !== who && !c.api)
          .map((c) => ({ c, lines: borrowedChat(c.messages, who as HelperName, c.helper), from: c.helper as Worker | undefined }))
          .filter((x) => x.lines.some((m) => m.kind !== "date" && m.kind !== "step"));
  const sections = [...borrowed, ...own];
  /* Mimi is the inbox for questions: every helper's ask shows in her chat as "Needs you" */
  const asks = who === "Mimi" ? asksIn(conversations.filter((c) => (conv.api ? !!c.api : !c.api))) : [];
  /* the typing dots belong to the chat the newest message was typed in */
  const lastMine = [...conv.messages].reverse().find((m): m is Extract<Message, { kind: "text" }> => m.kind === "text" && m.from === "me");
  const typedIn: Worker = lastMine?.to ?? "Mimi";
  const dotsHere = !conv.api || typedIn === who;
  /* the newest turn's chips fit this chat only when that turn was this helper's */
  const lastHandoff = [...conv.messages].reverse().find((m): m is Extract<Message, { kind: "step" }> => m.kind === "step" && m.variant === "handoff");
  const newestBy: Worker = lastHandoff?.to ?? "Mimi";
  const chipsFit = !conv.api || (focus ? newestBy === focus : newestBy === "Mimi" || lastHandoff?.via !== "assign");
  /* a question waiting on the owner is the next step: no chips under it */
  const openLines = sections.find((x) => x.c.slug === slug && !x.from)?.lines ?? [];
  const lastLine = [...openLines].reverse().find((m) => m.kind !== "date" && m.kind !== "event");
  const askOpen = lastLine?.kind === "ask" && !lastLine.answered && !answers[lastLine.id];
  /* computer level 1: a live status line in the header while the panel is closed */
  const compActive = computer.status === "live" || computer.status === "paused" || computer.status === "user";
  /* the Computer panel is sample data: its live chip never shows on a thread from the API */
  const compHere = !conv.api && compActive && (computer.helper === conv.helper || conv.messages.some((m) => m.kind === "computer" || ("from" in m && m.from === computer.helper)));

  return (
    <div className={cx("mc-tv", panelOpen && "has-panel", full && panelOpen && "is-full")} ref={host}>
      <section
        className="mc-thread"
        aria-label={focus ? `${focus}: her answers in your thread with Mimi` : `${conv.helper}: conversation`}
        /* helper threads take the helper's colour on your bubbles and the send button (helpers-v6.css) */
        data-helper={who === "Mimi" ? undefined : who.toLowerCase()}
      >
        {/* iMessage-style header (29 Oct 2026): menu left, the helper's face + name centred, actions right */}
        <header className="mc-hdr mc-hdr--title mc-hdr--center">
          <div className="mc-hdr__l">
            <button
              className="mc-fb mc-fb--back"
              type="button"
              aria-label={`Back to threads${elsewhere ? `, ${elsewhere} waiting on you` : ""}`}
              onClick={() => {
                if (window.matchMedia("(max-width: 899px)").matches) toggleSidebar();
                else router.push(consoleRoutes.threads);
              }}
            >
              <Icon name="chevron-left" />
              {elsewhere > 0 && <span className="mc-fb__n">{elsewhere > 99 ? "99+" : elsewhere}</span>}
            </button>
          </div>
          <div className="mc-more mc-tt">
              <button
                type="button"
                className="mc-tt__b"
                aria-haspopup="menu"
                aria-expanded={menu}
                title={`${who} · ${job}`}
                onClick={() => setMenu(!menu)}
              >
                <span className={cx("mc-tt__chip", who === "Mimi" && "is-mimi", (live || writing || face.state === "working") && "is-working")}>
                  <HelperFace
                    name={who}
                    size={60}
                    state={live || writing ? "working" : tstate === "stuck" ? "blocked" : tstate === "needs" ? "waiting" : isMimi && face.state === "waiting" ? "idle" : face.state}
                    dot={!isMimi && (face.needs > 0 || tstate === "needs")}
                    /* the status line already says "Needs you" / working: no side mark, so the face sits centred in its chip */
                    quiet
                  />
                </span>
                <span className={cx("mc-tt__nm", who === "Mimi" && "is-mimi")}>
                  <span className="mc-tt__t">{who}</span>
                  <Icon name="chevron-right" className="i mc-tt__c" />
                </span>
              </button>
              <p className="mf-job">{who === "Mimi" ? "Runs your team for Coral Lane · reports to you" : `${job} for Coral Lane · reports to you`}</p>
              <p className={cx("mc-tt__s", (live || writing) && "is-busy", tstate === "needs" && "is-needs")} aria-live="polite">
                {waitingAll > 0 ? null : statusText ? (
                  <button type="button" className="mc-tt__sb" aria-haspopup="dialog" aria-label={`${statusText}. Show steps`} onClick={() => setQuiet({ kind: "steps" })}>
                    <span key={statusText} className="mc-tt__st">
                      {statusText}
                    </span>
                  </button>
                ) : null}
                {waitingAll > 0 && (
                  <Link className="mc-tt__wt" href={consoleRoutes.needs} aria-label={`${waitingAll} waiting on you. Open them`}>
                    <i aria-hidden="true" />
                    {waitingAll} waiting
                  </Link>
                )}
              </p>
              {/* the demo / setup pill sits under the header, out of the feed's top fade (it read washed out there) */}
              {isMimi && !focus && <GettingStarted />}
              {menu && (
            <div className="mc-menu mc-menu--l" role="menu">
              {/* the role moved here from the header status line */}
              <p className="mc-menu__job">{job}</p>
              {focus && (
                <Link role="menuitem" href={consoleRoutes.home} onClick={() => setMenu(false)}>
                  <Icon name="message-square" />
                  Whole thread with Mimi
                </Link>
              )}
              <Link role="menuitem" href={helperHref(who)} onClick={() => setMenu(false)}>
                <Icon name="users" />
                About {who}
              </Link>
              <button role="menuitem" type="button" onClick={() => (setMenu(false), setQuiet({ kind: "steps" }))}>
                <Icon name="list-checks" />
                Steps
              </button>
              <button role="menuitem" type="button" onClick={() => (setMenu(false), setQuiet({ kind: "memory" }))}>
                <Icon name="file-text" />
                What I remember
              </button>
              <Link
                role="menuitem"
                href={consoleRoutes.home}
                onClick={(e) => {
                  setMenu(false);
                  if (conv.helper !== "Mimi") return;
                  e.preventDefault();
                  document.querySelector<HTMLTextAreaElement>(".mc-cmp textarea")?.focus();
                }}
              >
                <Icon name="plus" />
                New: ask Mimi
              </Link>
              <hr />
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
              className={cx("mc-fb mc-fb--round", panelOpen && "is-on")}
              aria-pressed={panelOpen}
              aria-label="Workspace panel"
              title="Workspace panel"
              onClick={togglePanel}
            >
              <Icon name="panel-right-open" />
            </button>
          </div>
        </header>
        <div className="mc-feed" ref={feed} data-motion={consoleMotion.spring ? "spring" : undefined}>
          <div className="mc-col mc-fi">
            {conv.helper === "Mimi" && !focus && <LiveDemoNote />}
            {sections.map(({ c, lines, from }, i) => (
              <TaskSection
                key={`${from ?? "own"}:${c.slug}`}
                c={c}
                lines={lines}
                from={from}
                open={c.slug === slug && !from}
                prevLabel={i > 0 ? labelOf(sections[i - 1]!.c) : undefined}
                typing={typingAny?.slug === c.slug && dotsHere && (!from || typingAny.who === who) ? (conv.api ? (who as Speaker) : typingAny.who) : null}
                onTask={(t) => setQuiet({ kind: "task", slug: t })}
                quiet={conv.helper === "Mimi"}
                focus={focus}
              />
            ))}
            <NeedsYou asks={asks} />
            {!askOpen && <Replies slug={slug} who={who} fit={chipsFit} />}
          </div>
        </div>
        <PlanStrip slug={slug} />
        <div className="mc-jump-host">
          {away && (
            <button
              type="button"
              className="mc-jump"
              aria-label="Jump to latest"
              title="Jump to latest"
              onClick={() => {
                const el = feed.current;
                if (!el) return;
                stick.current = true;
                setAway(false);
                el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
              }}
            >
              <Icon name="chevron-down" />
            </button>
          )}
          <Composer slug={slug} helper={who} assign={conv.api ? assignFor(who) : undefined} to={conv.api && focus ? focus : undefined} />
        </div>
        {sheetOpen && <PlanSheet />}
        {quiet?.kind === "steps" && <StepsSheet slug={slug} onClose={() => setQuiet(null)} />}
        {quiet?.kind === "memory" && <MemorySheet helper={conv.helper} onClose={() => setQuiet(null)} />}
        {quiet?.kind === "task" && (() => {
          const t = conversations.find((x) => x.slug === quiet.slug);
          return t ? <TaskSheet c={t} onClose={() => setQuiet(null)} /> : null;
        })()}
      </section>
      {!isMimi && !focus && !panelOpen && (
        <HelperBrief name={conv.helper as HelperName} state={live || writing ? "working" : face.state} step={statusText || face.step} />
      )}
      <WorkspacePanel slug={slug} host={host} />
    </div>
  );
}
