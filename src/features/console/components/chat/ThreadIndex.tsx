"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { conversationHref } from "@/features/console/demo/engine";
import { threadFaceState } from "@/features/console/demo/roster";
import { useThreads } from "@/features/console/api/hooks";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import type { Conversation } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const TABS = ["All", "Needs you", "Running", "Done"] as const;
type Tab = (typeof TABS)[number];
const inTab = (c: Conversation, t: Tab) =>
  t === "All" || (t === "Needs you" ? c.state === "needs" : t === "Running" ? c.state === "run" : c.state === "done" || c.state === "idle");

/** Every thread, newest first, filtered by state. */
export function ThreadIndex() {
  const { conversations, loading } = useThreads();
  const [tab, setTab] = useState<Tab>("All");
  const list = useMemo(() => conversations.filter((c) => inTab(c, tab)), [conversations, tab]);
  return (
    <>
      <div className="mc-dfl mc-ti__tabs" role="group" aria-label="Filter threads">
        {TABS.map((t) => (
          <button key={t} type="button" className={cx("mc-chip", tab === t && "is-on")} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t} <span className="mc-mono">{conversations.filter((c) => inTab(c, t)).length}</span>
          </button>
        ))}
      </div>
      {loading && <SkeletonRows count={6} />}
      {!loading && list.length === 0 && (
        <EmptyState>{conversations.length ? "Nothing in this tab right now" : "No threads yet. Ask Mimi something to start one."}</EmptyState>
      )}
      <ul className="mc-hl__card mc-ti" hidden={loading || list.length === 0}>
        {list.map((c, i) => (
          <li key={c.slug}>
            <Link href={conversationHref(c)} className="mc-hl__r">
              <HelperFace name={c.helper} size={24} state={threadFaceState(c)} quiet stagger={i} />
              <span className="mc-hl__tx">
                {c.title}
                <small>
                  {c.state === "needs" && <span className="mc-or">Needs you · </span>}
                  {c.state === "run" && <span className="mc-ink">Running · </span>}
                  {c.preview}
                </small>
              </span>
              <span className="mc-hl__ago mc-mono">{c.ago}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
