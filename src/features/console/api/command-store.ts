"use client";

import { useEffect, useSyncExternalStore } from "react";
import { readCommand } from "@/features/console/api/command-source";
import type { CommandData } from "@/features/console/lib/command-map";

/**
 * The Command read, held once and shared by every Command screen (the same external-store pattern as
 * live-store, so a re-read repaints the rail and the channel together). It reads once on first use;
 * a failed read says so and can be tried again.
 */
export type CommandState = {
  status: "loading" | "ready" | "failed";
  /** True while the screens are showing the typed mock rather than the API. */
  preview: boolean;
  data: CommandData | null;
  /** A plain sentence for a failed read. "" when there is nothing to say. */
  notice: string;
};

const INITIAL: CommandState = { status: "loading", preview: true, data: null, notice: "" };
let state: CommandState = INITIAL;
let started = false;
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function set(patch: Partial<CommandState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Reads Command once. A second call while a read is in flight does nothing. */
export function loadCommand(): void {
  if (started || state.status === "ready") return;
  started = true;
  set({ status: "loading", notice: "" });
  void readCommand()
    .then(({ data, preview }) => set({ status: "ready", preview, data, notice: "" }))
    .catch(() => {
      started = false;
      set({ status: "failed", notice: "Command couldn't be read just now." });
    });
}

/** The Command state, loading it on first mount. */
export function useCommand(): CommandState {
  useEffect(() => {
    loadCommand();
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL,
  );
}
