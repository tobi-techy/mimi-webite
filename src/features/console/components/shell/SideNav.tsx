"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WorkspaceMenu } from "@/features/console/components/shell/WorkspaceMenu";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { consoleRoutes, helperHref } from "@/features/console/config";
import { conversationHref } from "@/features/console/demo/engine";
import { faceStateLabel, rosterNames, rosterRow, type RosterRow } from "@/features/console/demo/roster";
import { owner } from "@/features/console/demo/seed";
import { useDemo } from "@/features/console/demo/store";
import { useShell } from "@/features/console/hooks/use-shell";
import { useShops } from "@/features/console/api/hooks";
import { seenAt, useLive } from "@/features/console/api/live-store";
import { USES_API } from "@/features/console/api/config";
import { cx } from "@/lib/cx";

function NavRow({
  href,
  icon,
  label,
  count,
  on,
}: {
  href: string;
  icon: IconName;
  label: string;
  count?: ReactNode;
  on?: boolean;
}) {
  return (
    <Link href={href} className="mc-nav" aria-current={on ? "page" : undefined}>
      <Icon name={icon} />
      <span className="mc-nav__label">{label}</span>
      {count !== undefined && <span className="mc-nav__k">{count}</span>}
    </Link>
  );
}

const nairaShort = (n: number) => `₦${n.toLocaleString("en-US")}`;

/**
 * Mimi's row opens the console home (her conversation); a helper's row opens her conversation. In
 * the live demo a helper's answers sit in the owner's one thread with Mimi, so her row opens her
 * side of it (`with=`); a helper with nothing yet opens her page.
 */
const rosterHref = (r: RosterRow) => {
  if (r.name === "Mimi") return consoleRoutes.home;
  if (!r.thread) return USES_API ? helperHref(r.name) : consoleRoutes.home;
  const href = conversationHref(r.thread);
  return r.shared ? `${href}${href.includes("?") ? "&" : "?"}with=${encodeURIComponent(r.name)}` : href;
};

/** The row's count: what waits on the owner (orange), else new lines since she was last opened (neutral). */
function RowCount({ r }: { r: RosterRow }) {
  if (r.needs > 0)
    return (
      <b className="mc-badge mc-ro__k" aria-hidden="true">
        {r.needs}
      </b>
    );
  if (r.unread && r.unread > 0)
    return (
      <b className="mc-badge mc-ro__k mc-ro__k--new" aria-hidden="true">
        {r.unread > 99 ? "99+" : r.unread}
      </b>
    );
  return null;
}

/** A neutral roster while the live demo waits for its first API answer: never the sample previews. */
function RosterSkeleton({ rail }: { rail?: boolean }) {
  return (
    <>
      {rosterNames.map((n) =>
        rail ? (
          <span key={n} className="mc-pin mc-pin--skel" role="listitem" aria-label="Loading">
            <span className="mc-skel mc-skel--face" />
          </span>
        ) : (
          <span key={n} className="mc-ro mc-ro--skel" role="listitem" aria-label="Loading">
            <span className="mc-skel mc-skel--face" />
            <span className="mc-ro__tx">
              <span className="mc-skel mc-skel--l1" />
              <span className="mc-skel mc-skel--l2" />
            </span>
          </span>
        ),
      )}
    </>
  );
}

/**
 * One roster row (Grok Bot style): face with state, name, relative time, an outcome preview and
 * an orange count when the helper needs you. Each helper has one conversation; the row opens it.
 * Hover, focus or a long-press swaps the preview for the current step and today's cost.
 */
function RosterItem({ r, on }: { r: RosterRow; on: boolean }) {
  const [peek, setPeek] = useState(false);
  /* a tap on a phone always lands: the drawer closes even when the row opens the page already open */
  const { closeDrawer } = useShell();
  const press = useRef<number | undefined>(undefined);
  const href = rosterHref(r);
  const label = `${r.name}, ${faceStateLabel[r.state].toLowerCase()}${r.needs ? `, ${r.needs} waiting on you` : r.unread ? `, ${r.unread} new` : ""}. ${r.preview}. Now: ${r.step}.${r.costToday ? ` ${nairaShort(r.costToday)} today.` : ""}`;
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
          return;
        }
        closeDrawer();
      }}
    >
      <HelperFace name={r.name} size={38} state={r.state} />
      <span className="mc-ro__tx">
        <span className="mc-ro__l1">
          <span className="mc-ro__n">{r.name}</span>
          <span className="mc-ro__ago">{r.state === "working" ? "now" : r.ago}</span>
          <span className="mc-ro__cost">{nairaShort(r.costToday)} today</span>
        </span>
        <span className="mc-ro__l2">
          <span className="mc-ro__pv">{r.preview}</span>
          <span className="mc-ro__step">{r.step}</span>
          <RowCount r={r} />
        </span>
      </span>
    </Link>
  );
}

/**
 * Sidebar: workspace switcher, search, Shops, Automations, then the roster (Mimi and six helpers,
 * one conversation each), the owner. Nothing waiting on the owner needs a row of its own: each
 * helper's row carries her orange count, Mimi's carries the team total and her conversation lists
 * every waiting card (the full pile stays at /console/needs and in ⌘K). Collapses to a rail on desktop.
 */
export function SideNav({ settings }: { settings: ReactNode }) {
  const pathname = usePathname();
  const { toggleSidebar, openPalette } = useShell();
  const conversations = useDemo((s) => s.conversations);
  const shopBook = useShops();
  /* while the demo build waits for the API the count is unknown, not 0 */
  const shopCount = shopBook.loading ? <span className="mc-skel mc-skel--k" role="img" aria-label="Loading" /> : shopBook.shops.length;
  const active = useDemo((s) => s.active);
  const autoCount = useDemo((s) => s.autos.length);
  const typing = useDemo((s) => s.typing);
  const computer = useDemo((s) => s.computer);
  const live = useLive((s) => s);
  /* the live demo before its first API answer: a neutral skeleton, never the sample previews */
  const waiting = USES_API && live.status === "connecting";
  const roster = useMemo(
    () => rosterNames.map((n) => rosterRow({ conversations, typing, computer }, n, seenAt(live, n))),
    [conversations, typing, computer, live],
  );
  const inSettings = pathname.startsWith(consoleRoutes.settings);
  /* the console home is Mimi's conversation */
  const inThread = pathname === consoleRoutes.home || pathname.startsWith(consoleRoutes.threads);
  /* the open conversation belongs to one helper; that roster row is the selected one */
  const activeHelper = inThread ? ((live.focus as RosterRow["name"] | null) ?? conversations.find((c) => c.slug === active)?.helper) : undefined;

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
        <Link href={consoleRoutes.shops} className="mc-ib" aria-label="Shops" title="Shops">
          <Icon name="store" />
        </Link>
        <Link href={consoleRoutes.automations} className="mc-ib" aria-label="Automations" title="Automations">
          <Icon name="refresh-cw" />
        </Link>
        <div className="mc-rail__faces" role="list" aria-label="Your team" aria-busy={waiting || undefined}>
          {waiting ? <RosterSkeleton rail /> : roster.map((r) => (
            <Link
              key={r.name}
              role="listitem"
              className={cx("mc-pin", activeHelper === r.name && "is-on")}
              href={rosterHref(r)}
              aria-label={`${r.name}, ${faceStateLabel[r.state].toLowerCase()}${r.needs ? `, ${r.needs} waiting on you` : ""}`}
              title={`${r.name} · ${r.step}`}
            >
              <HelperFace name={r.name} size={36} dot={r.needs > 0} state={r.state} />
            </Link>
          ))}
        </div>
        <span className="mc-grow" />
        <Link
          href={consoleRoutes.settings}
          className="mc-ini"
          aria-label={`${owner.name}, settings`}
          title="Settings"
        >
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
        <button
          type="button"
          className="mc-qs"
          onClick={openPalette}
          aria-label="Search and quick actions (⌘K)"
        >
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
            <nav className="mc-navs mc-navs--quiet" aria-label="Main">
              <NavRow
                href={consoleRoutes.shops}
                icon="store"
                label="Shops"
                count={shopCount}
                on={pathname.startsWith(consoleRoutes.shops) || pathname.startsWith(consoleRoutes.credit)}
              />
              <NavRow
                href={consoleRoutes.automations}
                icon="refresh-cw"
                label="Automations"
                count={autoCount}
                on={pathname.startsWith(consoleRoutes.automations)}
              />
            </nav>
            <div className="mc-side__scroll mc-side__team">
              <div className="mc-roster" role="list" aria-label="Your team" aria-busy={waiting || undefined}>
                {waiting ? <RosterSkeleton /> : roster.map((r) => <RosterItem key={r.name} r={r} on={activeHelper === r.name} />)}
              </div>
            </div>
          </>
        )}

        <div className="mc-me">
          <span className="mc-ini" aria-hidden="true">
            {owner.initials}
          </span>
          <span className="mc-me__tx" title={`${owner.name} · ${owner.company}`}>
            <span className="mc-me__nm">{owner.name}</span>
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
