"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WorkspaceMenu } from "@/features/console/components/shell/WorkspaceMenu";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { consoleRoutes } from "@/features/console/config";
import { conversationHref } from "@/features/console/demo/engine";
import { needCount } from "@/features/console/demo/needs";
import { faceStateLabel, rosterNames, rosterRow, type RosterRow } from "@/features/console/demo/roster";
import { owner } from "@/features/console/demo/seed";
import { useDemo } from "@/features/console/demo/store";
import { helperNames, type Conversation, type HelperName } from "@/features/console/demo/types";
import { useShell } from "@/features/console/hooks/use-shell";
import { cx } from "@/lib/cx";

const NEW_HREF = `${consoleRoutes.home}#new`;
const DONE_SHOWN = 6;
/** Demo setup progress: WhatsApp, Sheets and Paystack connected; shops import and team invite left. */
const SETUP_DONE = 3;
const SETUP_STEPS = 5;
const readHash = () => window.location.hash;
const onHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

function NavRow({ href, icon, label, count, on }: { href: string; icon: IconName; label: string; count?: ReactNode; on?: boolean }) {
  return (
    <Link href={href} className="mc-nav" aria-current={on ? "page" : undefined}>
      <Icon name={icon} />
      <span className="mc-nav__label">{label}</span>
      {count !== undefined && <span className="mc-nav__k">{count}</span>}
    </Link>
  );
}

function ThreadRow({ c, on }: { c: Conversation; on: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  /* keep the open thread visible in the sidebar list (it can sit below the fold in Done) */
  useEffect(() => {
    if (on) ref.current?.scrollIntoView({ block: "nearest" });
  }, [on]);
  return (
    <Link ref={ref} href={conversationHref(c)} className={cx("mc-th", on && "is-on")} aria-current={on ? "page" : undefined}>
      <HelperFace name={c.helper} size={18} />
      <span className="mc-th__tx">
        <span className="mc-th__t">{c.title}</span>
      </span>
      {c.working ? <i className="mc-spin mc-th__sp" aria-label="Running" /> : <span className="mc-th__ago">{c.ago}</span>}
    </Link>
  );
}

const nairaShort = (n: number) => `₦${n.toLocaleString("en-US")}`;

/**
 * One roster row (Grok Bot style): face with state, name, relative time, an outcome preview.
 * Hover, focus or a long-press swaps the preview for the current step and today's cost.
 */
function RosterItem({ r, on }: { r: RosterRow; on: boolean }) {
  const [peek, setPeek] = useState(false);
  const press = useRef<number | undefined>(undefined);
  const href = r.thread ? conversationHref(r.thread) : consoleRoutes.home;
  const label = `${r.name}, ${faceStateLabel[r.state].toLowerCase()}${r.needs ? `, ${r.needs} waiting on you` : ""}. ${r.preview}. Now: ${r.step}. ${nairaShort(r.costToday)} today.`;
  return (
    <Link
      href={href}
      role="listitem"
      className={cx("mc-ro", on && "is-on", peek && "is-peek")}
      aria-current={on ? "page" : undefined}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return;
        press.current = window.setTimeout(() => setPeek(true), 420);
      }}
      onPointerUp={() => window.clearTimeout(press.current)}
      onPointerLeave={() => {
        window.clearTimeout(press.current);
        setPeek(false);
      }}
      onContextMenu={(e) => peek && e.preventDefault()}
      onClick={(e) => {
        if (peek) {
          e.preventDefault();
          setPeek(false);
        }
      }}
    >
      <HelperFace name={r.name} size={28} state={r.state} dot={r.needs > 0} />
      <span className="mc-ro__tx">
        <span className="mc-ro__l1">
          <span className="mc-ro__n">{r.name}</span>
          <span className="mc-ro__ago">{r.state === "working" ? "now" : r.ago}</span>
          <span className="mc-ro__cost">{nairaShort(r.costToday)} today</span>
        </span>
        <span className="mc-ro__l2">
          <span className="mc-ro__pv">{r.preview}</span>
          <span className="mc-ro__step">{r.step}</span>
        </span>
      </span>
    </Link>
  );
}

/** Sidebar: workspace switcher, search row, helper faces, three links, threads by Needs you / Running / Done, the owner. Collapses to a rail. */
export function SideNav({ settings }: { settings: ReactNode }) {
  const pathname = usePathname();
  const { toggleSidebar, openPalette } = useShell();
  const conversations = useDemo((s) => s.conversations);
  const active = useDemo((s) => s.active);
  const autoCount = useDemo((s) => s.autos.length);
  const typing = useDemo((s) => s.typing);
  const computer = useDemo((s) => s.computer);
  const roster = useMemo(
    () => rosterNames.map((n) => rosterRow({ conversations, typing, computer }, n)),
    [conversations, typing, computer],
  );
  const [filter, setFilter] = useState<HelperName | "Mimi" | null>(null);
  const [moreDone, setMoreDone] = useState(false);
  const inSettings = pathname.startsWith(consoleRoutes.settings);
  const inThread = pathname.startsWith(consoleRoutes.threads);
  const needs = needCount(conversations);
  const hash = useSyncExternalStore(onHash, readHash, () => "");
  const isNew = pathname === consoleRoutes.home && hash === "#new";

  const groups = useMemo(() => {
    const list = filter ? conversations.filter((c) => c.helper === filter) : conversations;
    return {
      needs: list.filter((c) => c.state === "needs"),
      run: list.filter((c) => c.state === "run"),
      done: list.filter((c) => c.state === "done" || c.state === "idle"),
    };
  }, [conversations, filter]);

  const latest = (h: string) => conversations.find((c) => c.helper === h && c.state === "needs") ?? conversations.find((c) => c.helper === h);
  const faceState = (h: string) => ({
    needs: conversations.some((x) => x.helper === h && x.state === "needs"),
    busy: conversations.some((x) => x.helper === h && x.working),
  });
  const isOn = (c: Conversation) => inThread && active === c.slug;

  const faces = (rail: boolean) =>
    helperNames.map((h) => {
      const c = latest(h);
      const st = faceState(h);
      const row = roster.find((r) => r.name === h);
      return (
        <Link
          key={h}
          role="listitem"
          className="mc-pin"
          href={c ? conversationHref(c) : consoleRoutes.home}
          aria-label={`${h}${st.needs ? ", needs you" : ""}${st.busy ? ", working" : ""}`}
          title={rail ? `${h} · ${row ? row.step : ""}` : undefined}
        >
          <HelperFace name={h} size={28} dot={st.needs} state={row?.state} />
          {!rail && <span>{h}</span>}
        </Link>
      );
    });

  const group = (key: "needs" | "run" | "done", label: string, items: Conversation[]) => {
    if (!items.length) return null;
    const cut = key === "done" && !moreDone ? items.slice(0, DONE_SHOWN) : items;
    return (
      <div className="mc-tg" role="group" aria-label={label}>
        {key === "needs" ? (
          <Link href={consoleRoutes.home} className="mc-tg__h mc-tg__h--link">
            {label}
            {needs > 0 && <b className="mc-badge">{needs}</b>}
          </Link>
        ) : (
          <div className="mc-tg__h">
            {label} <span>{items.length}</span>
          </div>
        )}
        {cut.map((c) => (
          <ThreadRow key={c.slug} c={c} on={isOn(c)} />
        ))}
        {key === "done" && items.length > DONE_SHOWN && (
          <button type="button" className="mc-tg__more" onClick={() => setMoreDone(!moreDone)}>
            {moreDone ? "Show less" : `Show ${items.length - DONE_SHOWN} more`}
          </button>
        )}
      </div>
    );
  };

  return (
    <aside className="mc-side" id="console-side" aria-label={inSettings ? "Settings" : "Sidebar"}>
      {/* collapsed rail (desktop only) */}
      <div className="mc-rail">
        <button className="mc-ib" type="button" aria-label="Expand sidebar" onClick={toggleSidebar}>
          <Icon name="panel-left" />
        </button>
        <button className="mc-ib" type="button" aria-label="Search (⌘K)" onClick={openPalette}>
          <Icon name="search" />
        </button>
        <Link href={consoleRoutes.home} className="mc-ib mc-rail__needs" aria-label={`Needs you, ${needs}`} title="Needs you">
          <Icon name="house" />
          {needs > 0 && <b className="mc-badge mc-badge--dot">{needs}</b>}
        </Link>
        <div className="mc-rail__faces" role="list" aria-label="Helpers">
          {faces(true)}
        </div>
        <Link href={NEW_HREF} className="mc-ib" aria-label="New thread" title="New thread">
          <Icon name="plus" />
        </Link>
        <Link href={consoleRoutes.shops} className="mc-ib" aria-label="Shops" title="Shops">
          <Icon name="store" />
        </Link>
        <Link href={consoleRoutes.automations} className="mc-ib" aria-label="Automations" title="Automations">
          <Icon name="refresh-cw" />
        </Link>
        <span className="mc-grow" />
        <Link href={consoleRoutes.settings} className="mc-ini" aria-label={`${owner.name}, settings`} title="Settings">
          {owner.initials}
        </Link>
      </div>

      <div className="mc-side__full">
        <div className="mc-side__top">
          <WorkspaceMenu />
          <button className="mc-ib" type="button" aria-label="Collapse sidebar" onClick={toggleSidebar}>
            <Icon name="panel-left" />
          </button>
        </div>
        <button type="button" className="mc-qs" onClick={openPalette} aria-label="Search and quick actions (⌘K)">
          <Icon name="search" />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>

        {inSettings ? (
          <div className="mc-side__scroll mc-side__settings">
            <NavRow href={consoleRoutes.home} icon="chevron-left" label="Back to app" />
            {settings}
          </div>
        ) : (
          <>
            <div className="mc-side__scroll">
            <div className="mc-roster" role="list" aria-label="Your team">
              {roster.map((r) => (
                <RosterItem key={r.name} r={r} on={inThread && !!r.thread && active === r.thread.slug} />
              ))}
            </div>
            <nav className="mc-navs" aria-label="Main">
              <NavRow href={NEW_HREF} icon="plus" label="New thread" on={isNew} />
              <NavRow href={consoleRoutes.shops} icon="store" label="Shops" count={48} on={pathname.startsWith(consoleRoutes.shops) || pathname.startsWith(consoleRoutes.credit)} />
              <NavRow href={consoleRoutes.automations} icon="refresh-cw" label="Automations" count={autoCount} on={pathname.startsWith(consoleRoutes.automations)} />
            </nav>
              <div className="mc-thead">
                <span>Threads</span>
                <Link className="mc-ib mc-ib--sm" href={consoleRoutes.threads} aria-label="All threads">
                  <Icon name="list" />
                </Link>
              </div>
              <div className="mc-hf" role="group" aria-label="Filter threads by helper">
                <button type="button" className={cx("mc-hf__b", !filter && "is-on")} aria-pressed={!filter} onClick={() => setFilter(null)}>
                  All
                </button>
                {(["Mimi", ...helperNames] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={cx("mc-hf__b mc-hf__f", filter === h && "is-on")}
                    aria-pressed={filter === h}
                    aria-label={`Only ${h}`}
                    title={h}
                    onClick={() => setFilter(filter === h ? null : h)}
                  >
                    <HelperFace name={h} size={14} />
                  </button>
                ))}
              </div>
              {group("needs", "Needs you", groups.needs)}
              {group("run", "Running", groups.run)}
              {group("done", "Done", groups.done)}
              {!groups.needs.length && !groups.run.length && !groups.done.length && <p className="mc-tg__none">No threads for {filter}.</p>}
            </div>
          </>
        )}

        <Link href={`${consoleRoutes.settings}/connectors`} className="mc-gs" aria-label={`Getting started, ${SETUP_DONE} of ${SETUP_STEPS} done`}>
          <svg className="mc-gs__ring" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.25" />
            <circle cx="8" cy="8" r="6.25" pathLength="100" strokeDasharray={`${(SETUP_DONE / SETUP_STEPS) * 100} 100`} transform="rotate(-90 8 8)" />
          </svg>
          <span className="mc-gs__t">Getting started</span>
          <span className="mc-gs__k">
            {SETUP_DONE} of {SETUP_STEPS}
          </span>
        </Link>
        <div className="mc-me">
          <span className="mc-ini" aria-hidden="true">
            {owner.initials}
          </span>
          <span className="mc-me__tx">
            {owner.name}
            <small>{owner.company}</small>
          </span>
          <SoundToggle className="mc-ib" />
          <ThemeToggle className="mc-ib" />
          <Link href={consoleRoutes.settings} className="mc-ib" aria-label="Settings">
            <Icon name="settings" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
