"use client";

import { useSyncExternalStore } from "react";
import { USES_API } from "@/features/console/api/config";
import type { ErrorKind } from "@/features/console/api/mappers";
import type { CreditLine, CreditRecommendation } from "@/features/console/content/credit";
import type { Shop } from "@/features/console/content/shops";
import { isApiBacked } from "@/features/console/demo/store";

/**
 * State of the live layer (demo build, NEXT_PUBLIC_MIMI_MODE=demo), read by screens through
 * `useLive`. Threads themselves live in the demo store (so every chat component renders them);
 * the book (shops, credit) and the connection state live here.
 *
 * status: off (sample build) · connecting (first load, screens show skeletons) · ready (API data)
 * · fallback (API unreachable on first load: sample data, with a note).
 */
export type LiveStatus = "off" | "connecting" | "ready" | "fallback";

export type LiveState = {
  status: LiveStatus;
  /** The newest thing the owner should know, in plain words. Never a raw error. */
  notice: { kind: ErrorKind | "info"; text: string; at: number } | null;
  shops: Shop[] | null;
  shopDetails: Record<string, Shop>;
  creditLines: CreditLine[] | null;
  creditRecs: CreditRecommendation[] | null;
  /**
   * The demo's daily allowance is used up (or the demo is paused): the API refuses new turns, so
   * the composer is shut and says why. Set from a refused send (429/503) or from GET /v1/me.
   */
  cap: { kind: "capped" | "paused"; text: string } | null;
  /**
   * Sidebar unread counts: when the API data first showed (anything older counts as read) and when
   * the owner last had each helper's lines on screen. `focus` is the helper whose side of the
   * shared thread is open (the row tapped), so that row reads as selected.
   */
  since: number;
  viewed: Readonly<Record<string, number>>;
  focus: string | null;
};

const INITIAL: LiveState = {
  status: USES_API ? "connecting" : "off",
  notice: null,
  shops: null,
  shopDetails: {},
  creditLines: null,
  creditRecs: null,
  cap: null,
  since: 0,
  viewed: {},
  focus: null,
};
let live: LiveState = INITIAL;
const listeners = new Set<() => void>();

export const getLive = (): LiveState => live;

export function setLive(patch: Partial<LiveState>) {
  live = { ...live, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Read a slice of the live layer (selectors must return stable references). */
export function useLive<T>(select: (s: LiveState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(live),
    () => select(INITIAL),
  );
}

/** True while the demo build waits for its first API answer (screens show skeletons). */
export const useLiveLoading = (): boolean => useLive((s) => s.status === "connecting");

/** True when the console shows API data right now (not the sample fallback). */
export const apiActive = (): boolean => USES_API && isApiBacked() && live.status === "ready";

export function notify(kind: ErrorKind | "info", text: string) {
  setLive({ notice: { kind, text, at: Date.now() } });
}

/** When the owner last saw a helper's lines (0 before the API data showed: nothing counts as unread). */
export const seenAt = (s: LiveState, name: string): number => (s.since ? Math.max(s.since, s.viewed[name] ?? 0) : Number.POSITIVE_INFINITY);

/** The owner has these helpers' lines on screen now: their unread counts clear. */
export function markViewed(names: readonly string[]) {
  const now = Date.now();
  const viewed = { ...live.viewed };
  for (const n of names) viewed[n] = now;
  setLive({ viewed });
}

/** The helper whose side of the shared thread is open, or null. */
export function setFocus(focus: string | null) {
  if (live.focus !== focus) setLive({ focus });
}
