"use client";

import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";
import { Row } from "@/features/console/components/ui/Row";
import { useTheme } from "@/hooks/use-theme";
import { switchTheme } from "@/lib/theme";
import { cx } from "@/lib/cx";

/**
 * Settings > Appearance, Factory's pattern: System / Light / Dark preview cards wired to the
 * console theme, the palette as read-only swatches, and two text controls (message size, line
 * height) saved on this device.
 */

type Mode = "system" | "light" | "dark";
const MODE_KEY = "mimi-console-theme-mode";
const TEXT_KEY = "mimi-console-text";
const DEFAULT_TEXT = { size: 13.3333, line: 1.6 };

function readMode(): Mode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === "system" || v === "light" || v === "dark") return v;
  } catch {
    /* storage blocked */
  }
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function readText(): typeof DEFAULT_TEXT {
  try {
    const v = JSON.parse(localStorage.getItem(TEXT_KEY) ?? "null") as Partial<typeof DEFAULT_TEXT> | null;
    if (v && typeof v.size === "number" && typeof v.line === "number") return { size: v.size, line: v.line };
  } catch {
    /* storage blocked or bad value */
  }
  return DEFAULT_TEXT;
}

function applyText(t: typeof DEFAULT_TEXT) {
  const root = document.documentElement.style;
  if (t.size === DEFAULT_TEXT.size) root.removeProperty("--msg-font-size");
  else root.setProperty("--msg-font-size", `${t.size}px`);
  if (t.line === DEFAULT_TEXT.line) root.removeProperty("--msg-line-height");
  else root.setProperty("--msg-line-height", String(t.line));
}

const systemTheme = () => (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

/** Follows the OS theme while the mode is System. */
function useSystemFollow(mode: Mode | null) {
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const on = () => switchTheme(systemTheme());
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mode]);
}

/** Mounted once in the console shell: restores text settings and keeps System mode in sync. */
export function AppearanceBoot() {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    applyText(readText());
    const m = readMode();
    if (m === "system" && document.documentElement.getAttribute("data-theme") !== systemTheme()) switchTheme(systemTheme());
    const id = window.setTimeout(() => setMode(m), 0);
    const onStore = () => setMode(readMode());
    window.addEventListener("mimi-appearance", onStore);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("mimi-appearance", onStore);
    };
  }, []);
  useSystemFollow(mode);
  return null;
}

function Preview({ kind }: { kind: Mode }) {
  return (
    <span className={cx("x-apv", `x-apv--${kind}`)} aria-hidden="true">
      <span className="x-apv__half x-apv__half--a">
        <span className="x-apv__side">
          <i />
          <i />
          <i />
        </span>
        <span className="x-apv__main">
          <i />
          <i />
          <i />
          <i className="x-apv__mark" />
        </span>
      </span>
      {kind === "system" && (
        <span className="x-apv__half x-apv__half--b">
          <span className="x-apv__main">
            <i />
            <i />
            <i />
          </span>
        </span>
      )}
    </span>
  );
}

function Swatch({ label, desc, value }: { label: string; desc?: string; value: string }) {
  return (
    <Row title={label} description={desc}>
      <span className="x-sw" title="Fixed by the Factory palette">
        <i style={{ background: value }} />
        <span>{value}</span>
      </span>
    </Row>
  );
}

function Slider({ label, desc, min, max, step, value, fmt, onChange }: { label: string; desc: string; min: number; max: number; step: number; value: number; fmt: (n: number) => string; onChange: (n: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <Row title={label} description={desc}>
      <span className="x-sld">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          style={{ "--p": `${pct}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="x-sld__v">{fmt(value)}</span>
      </span>
    </Row>
  );
}

export function AppearanceView() {
  const theme = useTheme();
  const [mode, setModeState] = useState<Mode>("dark");
  const [text, setText] = useState(DEFAULT_TEXT);
  useEffect(() => {
    const id = window.setTimeout(() => {
      setModeState(readMode());
      setText(readText());
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function pick(m: Mode, e: MouseEvent<HTMLButtonElement>) {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* storage blocked */
    }
    window.dispatchEvent(new Event("mimi-appearance"));
    const next = m === "system" ? systemTheme() : m;
    if (next !== theme) {
      const r = e.currentTarget.getBoundingClientRect();
      switchTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
  }

  function setT(patch: Partial<typeof DEFAULT_TEXT>) {
    const next = { ...text, ...patch };
    setText(next);
    applyText(next);
    try {
      localStorage.setItem(TEXT_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
  }

  const dark = theme === "dark";
  return (
    <>
      <section aria-labelledby="ap-h" className="x-sg">
        <h2 id="ap-h" className="x-sg__h">
          Appearance
        </h2>
        <div className="x-apc" role="radiogroup" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} className={cx("x-apc__o", mode === m && "is-on")} onClick={(e) => pick(m, e)}>
              <Preview kind={m} />
              <span className="x-apc__l">{m === "system" ? "System" : m === "light" ? "Light" : "Dark"}</span>
            </button>
          ))}
        </div>
      </section>
      <section aria-labelledby="ap-c" className="x-sg">
        <h2 id="ap-c" className="x-sg__h">
          {dark ? "Dark theme" : "Light theme"}
        </h2>
        <Swatch label="Background" value={dark ? "#101010" : "#FAFAFA"} />
        <Swatch label="Foreground" value={dark ? "#FFFFFF" : "#101010"} />
        <Swatch label="User message bubble" desc="Fill behind your messages in chat." value={dark ? "#212121" : "#F0EFED"} />
        <Swatch label="Accent" desc="Status and marks only." value="#EE6018" />
      </section>
      <section aria-labelledby="ap-t" className="x-sg">
        <h2 id="ap-t" className="x-sg__h">
          Text
        </h2>
        <Row title="Content font" description="Used for chat messages and rendered markdown.">
          <span className="x-pk x-pk--static">Geist</span>
        </Row>
        <Row title="Code font">
          <span className="x-pk x-pk--static">Geist Mono</span>
        </Row>
        <Slider label="Message size" desc="Chat messages, in pixels." min={12} max={16} step={0.5} value={text.size} fmt={(n) => (Math.abs(n - 13.3333) < 0.01 ? "13.3" : String(n))} onChange={(n) => setT({ size: n })} />
        <Slider label="Line height" desc="Space between lines in a message." min={1.2} max={2} step={0.1} value={text.line} fmt={(n) => n.toFixed(1)} onChange={(n) => setT({ line: Math.round(n * 10) / 10 })} />
        <Row title="Reset text" description="Back to 13.3px and 1.6.">
          <button type="button" className="x-sbtn" onClick={() => setT(DEFAULT_TEXT)}>
            Reset
          </button>
        </Row>
      </section>
    </>
  );
}
