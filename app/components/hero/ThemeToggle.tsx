"use client";

import { useCallback, useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_EVENT = "themechange";
const SYSTEM_DARK = "(prefers-color-scheme: dark)";

function storedTheme(): Theme | null {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

function systemTheme(): Theme {
  return window.matchMedia(SYSTEM_DARK).matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(THEME_EVENT));
}

function subscribe(onChange: () => void) {
  const system = window.matchMedia(SYSTEM_DARK);
  const onSystemChange = () => {
    if (!storedTheme()) applyTheme(systemTheme());
  };
  window.addEventListener(THEME_EVENT, onChange);
  system.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    system.removeEventListener("change", onSystemChange);
  };
}

function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  return (
    <button
      className={styles.toggle}
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className={styles.icon} aria-hidden="true">
        <svg className={styles.sun} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M12.95 3.05l-1.13 1.13M4.18 11.82l-1.13 1.13"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <svg className={styles.moon} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.2 9.9A5.7 5.7 0 0 1 6.1 2.8a5.7 5.7 0 1 0 7.1 7.1Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
