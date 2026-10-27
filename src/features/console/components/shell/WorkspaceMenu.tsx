"use client";

import Link from "next/link";
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";
import { owner } from "@/features/console/demo/seed";
import { useDismiss } from "@/features/console/hooks/use-dismiss";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";

/** Demo workspaces. Only the first one is real; the others show a toast. */
const WORKSPACES = [
  { name: owner.company, detail: "48 shops · Ikeja", initials: "WT" },
  { name: "Funmi Distribution", detail: "22 shops · Ibadan", initials: "FD" },
  { name: "Lagos Mainland Depot", detail: "31 shops · Yaba", initials: "LM" },
] as const;
const OWNER_EMAIL = "emeka@corallane.example";

/**
 * The sidebar workspace switcher: a button that opens a small card under it with the current
 * workspace, a switch list, create, settings and log out. role=menu with arrow keys, Home/End,
 * Escape (refocuses the button) and close on any outside click or selection.
 */
export function WorkspaceMenu() {
  const id = useId();
  const say = useToast();
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const refs = useMemo(() => [btn, menu], []);
  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  }, []);
  const dismiss = useCallback(() => close(), [close]);
  useDismiss(open, refs, dismiss);

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? []);

  function show(focus: "first" | "last" = "first") {
    setOpen(true);
    sfx("console", "open", { emphasis: "subtle" });
    requestAnimationFrame(() => {
      const list = items();
      (focus === "last" ? list[list.length - 1] : list[0])?.focus();
    });
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "Tab") close();
  }

  const pick = (msg?: string) => {
    close(true);
    if (msg) say(msg);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className="mc-ws"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-label={`Workspace: ${owner.company}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            show(e.key === "ArrowUp" ? "last" : "first");
          }
        }}
      >
        <span className="mc-ws__mk" aria-hidden="true">
          <HelperFace name="Mimi" size={15} />
        </span>
        <span className="mc-ws__nm">{owner.company}</span>
        <Icon name="chevron-down" />
      </button>
      {open && (
        <div ref={menu} id={`${id}-menu`} className="mc-wsm" role="menu" aria-label="Workspace" onKeyDown={onKey}>
          <div className="mc-wsm__hd" role="presentation">
            <span className="mc-ws__mk mc-wsm__mk--lg" aria-hidden="true">
              <HelperFace name="Mimi" size={18} />
            </span>
            <span className="mc-wsm__tx">
              <span className="mc-wsm__nm">
                <span>{owner.company}</span>
                <span className="mc-wsm__role">Owner</span>
              </span>
              <small>{OWNER_EMAIL}</small>
            </span>
          </div>
          <p className="mc-wsm__cap" role="presentation">
            Switch workspace
          </p>
          <div role="group" aria-label="Switch workspace">
            {WORKSPACES.map((w, i) => {
              const on = i === 0;
              return (
                <button
                  key={w.name}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  tabIndex={-1}
                  className="mc-wsm__it"
                  onClick={() => pick(on ? undefined : `${w.name} is a demo workspace. You're still in ${owner.company}.`)}
                >
                  <span className="mc-ws__mk" aria-hidden="true">
                    {on ? <HelperFace name="Mimi" size={13} /> : <b>{w.initials}</b>}
                  </span>
                  <span className="mc-wsm__tx">
                    {w.name}
                    <small>{w.detail}</small>
                  </span>
                  {on && <Icon name="check" className="i mc-wsm__ck" />}
                </button>
              );
            })}
          </div>
          <button type="button" role="menuitem" tabIndex={-1} className="mc-wsm__it" onClick={() => pick("New workspaces open after launch")}>
            <span className="mc-wsm__ic" aria-hidden="true">
              <Icon name="plus" />
            </span>
            <span className="mc-wsm__tx">Create workspace</span>
          </button>
          <hr role="separator" />
          <Link role="menuitem" tabIndex={-1} className="mc-wsm__it" href={consoleRoutes.settings} onClick={() => close()}>
            <span className="mc-wsm__ic" aria-hidden="true">
              <Icon name="settings" />
            </span>
            <span className="mc-wsm__tx">Settings</span>
          </Link>
          <Link role="menuitem" tabIndex={-1} className="mc-wsm__it" href="/" onClick={() => close()}>
            <span className="mc-wsm__ic" aria-hidden="true">
              <Icon name="log-out" />
            </span>
            <span className="mc-wsm__tx">Log out</span>
          </Link>
        </div>
      )}
    </>
  );
}
