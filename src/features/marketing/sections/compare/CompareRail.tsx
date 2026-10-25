"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";

export type RailItem = { id: string; label: string };

/**
 * "On this page": a sticky rail on desktop that marks the section in view, and a plain
 * horizontal strip of links on phones. Links are in-page anchors (HashScroll offsets the nav).
 */
export function CompareRail({ items }: { items: readonly RailItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = items.find((i) => seen.get(i.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  return (
    <nav className="x-cmp__rail" aria-label="On this page">
      <p className="x-label">On this page</p>
      <ol>
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={cx(active === i.id && "is-on")}
              aria-current={active === i.id ? "location" : undefined}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
