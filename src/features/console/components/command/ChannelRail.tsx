"use client";

import Link from "next/link";
import { Icon } from "@/features/console/components/ui/Icon";
import { commandHref } from "@/features/console/config";
import type { ChannelGroup } from "@/features/console/lib/command-rules";
import { cx } from "@/lib/cx";

/**
 * The channel rail: the caller's channels, grouped the way the business runs, not the org chart.
 * Each row carries what is unread and what is still open, in plain words. "Needs you" sits at the
 * top because that is what a supervisor opens first. A channel the caller is not in is simply not
 * drawn, so a supervisor sees their own territories and no one else's.
 */
export function ChannelRail({
  groups,
  needsCount,
  selected,
}: {
  groups: ChannelGroup[];
  needsCount: number;
  /** The channel's slug, or "needs" for the pile, or null for the pile. */
  selected: string | null;
}) {
  return (
    <nav className="cmd-rail" aria-label="Channels">
      <Link
        href={commandHref()}
        className={cx("cmd-c", "cmd-c--needs", (selected ?? "needs") === "needs" && "is-on")}
        aria-current={(selected ?? "needs") === "needs" ? "page" : undefined}
        aria-label={`Needs you, ${needsCount} item${needsCount === 1 ? "" : "s"}`}
      >
        <Icon name="list-checks" />
        <span className="cmd-c__n">Needs you</span>
        {needsCount > 0 && <b className="cmd-c__u">{needsCount}</b>}
      </Link>

      {groups.map((g) => (
        <div className="cmd-grp" key={g.kind}>
          <p className="cmd-gh">
            <Icon name={g.icon} />
            {g.label}
          </p>
          {g.channels.map((c) => (
            <Link
              key={c.id}
              href={commandHref(c.slug)}
              className={cx("cmd-c", selected === c.slug && "is-on")}
              aria-current={selected === c.slug ? "page" : undefined}
              aria-label={`${c.name}, ${c.unread} unread, ${c.openItems} open item${c.openItems === 1 ? "" : "s"}`}
            >
              <span className="cmd-c__n">{c.name}</span>
              {c.unread > 0 && <b className="cmd-c__u">{c.unread}</b>}
              <span className="cmd-c__o">{c.openItems} open</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
