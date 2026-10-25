"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Avatar } from "@/features/console/components/ui/Avatar";
import { Icon } from "@/features/console/components/ui/Icon";
import { useToast } from "@/features/console/hooks/use-toast";
import {
  groupHeading,
  lookBacks,
  paletteSections,
  paletteTabs,
  type LookBack,
  type PaletteItem,
  type PaletteTab,
} from "@/features/console/lib/palette-items";
import { cx } from "@/lib/cx";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { DEMO_SLUG, conversationHref, playDemo, resetDemo, stageStory } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import { Kbd } from "@/features/console/components/ui/Kbd";

/** ⌘K quick actions: search threads, shops, pages, settings and actions. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const say = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<PaletteTab>("All");
  const [lookBack, setLookBack] = useState<LookBack>("30d");
  const [active, setActive] = useState(0);

  const conversations = useDemo((s) => s.conversations);
  const live = useMemo<PaletteItem[]>(
    () =>
      conversations.map((c) => ({
        id: `c-${c.slug}`,
        group: "Threads",
        icon: "message-square",
        face: c.helper,
        title: c.title,
        meta: `${c.state === "needs" ? "Needs you" : c.state === "run" ? "Running" : c.state === "done" ? "Done" : c.helper} · ${c.folder} · ${c.ago}`,
        href: conversationHref(c),
      })),
    [conversations],
  );
  const sections = useMemo(() => paletteSections(query, tab, lookBack, live), [query, tab, lookBack, live]);
  const flat = useMemo(() => sections.flatMap(([, items]) => items), [sections]);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    inputRef.current?.focus();
    return () => {
      if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
    };
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(".is-act")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function run(it: PaletteItem | undefined) {
    if (!it) return;
    returnFocus.current = null;
    onClose();
    if (it.href) router.push(it.href);
    if (it.action === "pauseAll") say("All computers paused");
    if (it.action === "addShop") say("Enter the shop's WhatsApp number to send an invite");
    if (it.action === "playDemo") void playDemo((href) => router.push(href));
    if (it.action === "walkDemo") {
      stageStory();
      router.push(`/console/threads/${DEMO_SLUG}`);
    }
    if (it.action === "resetDemo") {
      resetDemo();
      say("Demo reset to the start");
    }
  }

  function onKey(e: KeyboardEvent) {
    const n = flat.length;
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && n)
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
    else if (e.key === "Enter") run(flat[active]);
    else if (e.key === "Tab") {
      const i = paletteTabs.indexOf(tab);
      setTab(paletteTabs[(i + (e.shiftKey ? paletteTabs.length - 1 : 1)) % paletteTabs.length] ?? "All");
      setActive(0);
    } else if (e.key === "Escape") onClose();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="x-ckw" onClick={(e) => e.target === e.currentTarget && onClose()} onKeyDown={onKey}>
      <div className="x-ckm" role="dialog" aria-modal="true" aria-label="Quick actions">
        <div className="x-ckin">
          <Icon name="search" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search threads, shops, helpers and actions"
            aria-label="Search"
            autoComplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="ck-list"
            aria-activedescendant={flat.length ? `ck-${active}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
          />
          <Kbd>esc</Kbd>
        </div>
        <div className="x-ckt" role="tablist">
          {paletteTabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              tabIndex={-1}
              aria-selected={tab === t}
              className={cx(tab === t && "is-on")}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="x-ckl" id="ck-list" role="listbox" ref={listRef}>
          {flat.length === 0 && <p className="x-empty x-empty--pad">No results for “{query}”</p>}
          {sections.map(([group, items]) =>
            items.length ? (
              <div key={group} role="group" aria-label={groupHeading[group]}>
                <p className="x-cap">{groupHeading[group]}</p>
                {items.map((it) => {
                  const i = flat.indexOf(it);
                  return (
                    <button
                      key={it.id}
                      id={`ck-${i}`}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={i === active}
                      className={cx("x-ckr", i === active && "is-act")}
                      onMouseMove={() => setActive(i)}
                      onClick={() => run(it)}
                    >
                      {it.face ? (
                        <HelperFace name={it.face} size={18} ring={28} />
                      ) : it.avatar ? (
                        <Avatar name={it.title} />
                      ) : (
                        <Icon name={it.icon} />
                      )}
                      <span>
                        <b>{it.title}</b>
                        <small>{it.meta}</small>
                      </span>
                      <Kbd>↵</Kbd>
                    </button>
                  );
                })}
              </div>
            ) : null,
          )}
        </div>
        <div className="x-ckf">
          Look back
          <span className="x-seg" role="group" aria-label="Look back">
            {lookBacks.map((b) => (
              <button
                key={b}
                type="button"
                tabIndex={-1}
                aria-pressed={lookBack === b}
                className={cx(lookBack === b && "is-on")}
                onClick={() => setLookBack(b)}
              >
                {b}
              </button>
            ))}
          </span>
          <span className="x-grow"></span>
          <span>
            <Kbd>↑↓</Kbd> Navigate
          </span>
          <span>
            <Kbd>↵</Kbd> Select
          </span>
          <span>
            <Kbd>tab</Kbd> Filter
          </span>
          <span>
            <Kbd>esc</Kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
