"use client";

import {
  Fragment,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { useDismiss } from "@/features/console/hooks/use-dismiss";
import { cx } from "@/lib/cx";

export type PickerOption = {
  value: string;
  detail?: string;
  icon?: IconName;
  lead?: ReactNode;
  section?: string;
};

type PickerProps = {
  label: string;
  options: readonly PickerOption[];
  /** Selected value. Omit for an action menu (icon button that runs `onChange`). */
  value?: string;
  onChange: (value: string) => void;
  variant?: "ghost" | "plain";
  /** Icon for action menus (default "ellipsis"). */
  menuIcon?: IconName;
  /** Leading content in the button (overrides the selected option's icon). */
  lead?: ReactNode;
  /** Button text (defaults to the value). */
  buttonLabel?: string;
};

const MENU_GAP = 4;
const SEARCH_THRESHOLD = 6;

/**
 * Dropdown listbox (`.x-pk` button + `.x-pkm` menu): arrow keys, Enter, Escape and type-to-filter
 * when the list is long. Positioned under (or above) its button and closed by any outside action.
 */
export function Picker({
  label,
  options,
  value,
  onChange,
  variant = "ghost",
  menuIcon = "ellipsis",
  lead,
  buttonLabel,
}: PickerProps) {
  const isMenu = value === undefined;
  const id = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<CSSProperties>({});

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => `${o.value} ${o.detail ?? ""}`.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    setQuery("");
    if (refocus) btnRef.current?.focus();
  }, []);
  const refs = useMemo(() => [btnRef, menuRef], []);
  const dismiss = useCallback(() => close(), [close]);
  useDismiss(open, refs, dismiss);

  function show() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const estimate = Math.min(360, options.length * 40 + 16);
    const below = r.bottom + MENU_GAP + estimate <= window.innerHeight - 8 || r.top - MENU_GAP - estimate < 8;
    setPos({
      minWidth: Math.max(200, r.width),
      left: Math.max(8, Math.min(r.left, window.innerWidth - 248)),
      ...(below ? { top: r.bottom + MENU_GAP } : { bottom: window.innerHeight - r.top + MENU_GAP }),
    });
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
    requestAnimationFrame(() =>
      menuRef.current?.querySelector<HTMLElement>("input, [role=listbox]")?.focus(),
    );
  }

  function pick(v: string) {
    close(true);
    onChange(v);
  }

  function onKey(e: KeyboardEvent) {
    const n = visible.length;
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && n) {
      e.preventDefault();
      setActive((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = visible[active];
      if (o) pick(o.value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      close(true);
    }
  }

  const current = options.find((o) => o.value === value);
  const listId = `${id}-list`;

  return (
    <>
      <button
        ref={btnRef}
        className={cx("x-pk", isMenu ? "x-pk--icon" : variant === "ghost" && "x-pk--ghost")}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={isMenu ? label : undefined}
        title={label}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            show();
          }
        }}
      >
        {isMenu ? (
          <Icon name={menuIcon} />
        ) : (
          <>
            {lead ?? (current?.lead || (current?.icon && <Icon name={current.icon} />))}
            <span>{buttonLabel ?? value}</span>
            <Icon name="chevron-down" />
          </>
        )}
      </button>
      {open && (
        <div ref={menuRef} className="x-pkm" style={pos} onKeyDown={onKey}>
          {options.length > SEARCH_THRESHOLD && (
            <label className="x-search">
              <Icon name="search" />
              <input
                type="text"
                placeholder="Search"
                aria-label="Search options"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
              />
            </label>
          )}
          <div role="listbox" id={listId} aria-label={label} tabIndex={-1}>
            {visible.length === 0 && <p className="x-pkc">No matches</p>}
            {visible.map((o, i) => {
              const heading = o.section && o.section !== visible[i - 1]?.section ? o.section : undefined;
              return (
                <Fragment key={o.value}>
                  {heading && <p className="x-pkc">{heading}</p>}
                  <button
                    type="button"
                    role="option"
                    tabIndex={-1}
                    className={cx("x-pko", i === active && "is-act")}
                    aria-selected={o.value === value}
                    onMouseMove={() => setActive(i)}
                    onClick={() => pick(o.value)}
                  >
                    {o.lead ?? (o.icon && <Icon name={o.icon} />)}
                    <span>
                      {o.value}
                      {o.detail && <small>{o.detail}</small>}
                    </span>
                    <Icon name="check" className="i x-ck" />
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
