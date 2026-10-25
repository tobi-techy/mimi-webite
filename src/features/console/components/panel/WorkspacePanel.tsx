"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ComputerTab } from "@/features/console/components/panel/ComputerTab";
import { DocsTab } from "@/features/console/components/panel/DocsTab";
import { SideChatTab } from "@/features/console/components/panel/SideChatTab";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { closePanel, setDocFilter, setPanelFull, setPanelTab } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import type { DocFilter, PanelTab } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const W_KEY = "mimi-console-panel-w";
const MIN = 320;
const THREAD_MIN = 380;
export const PANEL_DEFAULT = 540;

const TABS: { tab: Exclude<PanelTab, "Launcher">; icon: IconName }[] = [
  { tab: "Computer", icon: "monitor" },
  { tab: "Side chat", icon: "message-square" },
  { tab: "Docs", icon: "file-text" },
];

/** Saved width (the panel only renders on the client, after a click, so no hydration mismatch). */
function savedWidth(): number {
  try {
    const w = Number(localStorage.getItem(W_KEY));
    return w >= MIN ? w : PANEL_DEFAULT;
  } catch {
    return PANEL_DEFAULT;
  }
}

export const LAUNCH: { tab: PanelTab; icon: IconName; label: string; desc: string; keys: string; filter?: DocFilter }[] = [
  { tab: "Computer", icon: "monitor", label: "Computer", desc: "watch or take over", keys: "⌘J" },
  { tab: "Side chat", icon: "message-square", label: "Side chat", desc: "ask without touching the thread", keys: "⌥⌘S" },
  { tab: "Docs", icon: "file-text", label: "Docs", desc: "invoices, plans, reports", keys: "⌘P" },
  { tab: "Docs", icon: "folder", label: "Files", desc: "photos and uploads", keys: "⌘O", filter: "By you" },
];

/** The right workspace panel: Computer, Side chat and Docs. Resizable, full width, closable. */
export function WorkspacePanel({ slug, host }: { slug: string; host: React.RefObject<HTMLDivElement | null> }) {
  const panel = useDemo((s) => s.panel);
  const live = useDemo((s) => s.computer.status === "live");
  const [width, setWidth] = useState(savedWidth);
  const [drag, setDrag] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const max = () => Math.max(MIN, (host.current?.clientWidth ?? 1200) - THREAD_MIN);
  const commit = (w: number) => {
    const next = Math.round(Math.min(Math.max(w, MIN), max()));
    setWidth(next);
    try {
      localStorage.setItem(W_KEY, String(next));
    } catch {
      /* ignore */
    }
  };

  /* Esc leaves full width */
  useEffect(() => {
    if (!panel.full) return;
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setPanelFull(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [panel.full]);

  function onDown(e: PointerEvent<HTMLDivElement>) {
    if (panel.full) return;
    setDrag(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const right = host.current?.getBoundingClientRect().right ?? window.innerWidth;
    commit(right - e.clientX);
  }
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowLeft") commit(width + step);
    else if (e.key === "ArrowRight") commit(width - step);
    else if (e.key === "Home") commit(MIN);
    else if (e.key === "End") commit(max());
    else if (e.key === "Enter") setPanelFull(!panel.full);
    else return;
    e.preventDefault();
  }

  if (!panel.open) return null;

  const launch = (i: (typeof LAUNCH)[number]) => {
    if (i.filter) setDocFilter(i.filter);
    else if (i.tab === "Docs") setDocFilter("All");
    setPanelTab(i.tab);
  };

  return (
    <aside
      className={cx("mc-pn", panel.full && "is-full", drag && "is-drag")}
      style={{ "--pw": `${width}px` } as React.CSSProperties}
      aria-label="Workspace"
    >
      {!panel.full && (
        <div
          className={cx("mc-rz", drag && "is-on")}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the workspace panel"
          aria-valuemin={MIN}
          aria-valuemax={1600}
          aria-valuenow={width}
          tabIndex={0}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
          onDoubleClick={() => setPanelFull(true)}
          onKeyDown={onKey}
        >
          <i />
        </div>
      )}
      <div className="mc-ptb">
        <div className="mc-tabs" role="tablist" aria-label="Workspace">
          {TABS.map(({ tab, icon }) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={panel.tab === tab}
              className={cx("mc-tab", panel.tab === tab && "is-on")}
              onClick={() => launch({ tab, icon, label: tab, desc: "", keys: "" })}
            >
              <Icon name={icon} />
              {tab}
              {tab === "Computer" && live && <i className="mc-tab__live" aria-label="live" />}
            </button>
          ))}
        </div>
        <span className="mc-grow" />
        <button type="button" className="mc-ib" aria-label="Open something else" onClick={() => setPanelTab("Launcher")}>
          <Icon name="plus" />
        </button>
        <button
          type="button"
          className="mc-ib mc-hide-phone"
          aria-label={panel.full ? "Exit full width (Esc)" : "Full width"}
          onClick={() => setPanelFull(!panel.full)}
        >
          <Icon name={panel.full ? "minimize-2" : "maximize-2"} />
        </button>
        <button type="button" className="mc-ib" aria-label="Close the workspace panel" onClick={closePanel}>
          <Icon name="x" />
        </button>
      </div>
      <div className="mc-pbd" ref={bodyRef} role="tabpanel" aria-label={panel.tab}>
        {panel.tab === "Computer" && <ComputerTab />}
        {panel.tab === "Side chat" && <SideChatTab />}
        {panel.tab === "Docs" && <DocsTab slug={slug} filter={panel.filter ?? "All"} setFilter={setDocFilter} />}
        {panel.tab === "Launcher" && (
          <div className="mc-lnc">
            {LAUNCH.map((i) => (
              <button key={i.label} type="button" className="mc-lnc__i" onClick={() => launch(i)}>
                <i>
                  <Icon name={i.icon} />
                </i>
                {i.label}
                <span className="mc-lnc__d">{i.desc}</span>
                <kbd>{i.keys}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
