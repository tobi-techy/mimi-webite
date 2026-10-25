"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, type Theme } from "@/config/theme";
import { readTheme, subscribeTheme } from "@/lib/theme";

/** The current theme, kept in sync with `<html data-theme>`. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME);
}
