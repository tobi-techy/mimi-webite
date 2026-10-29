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
};

const INITIAL: LiveState = {
  status: USES_API ? "connecting" : "off",
  notice: null,
  shops: null,
  shopDetails: {},
  creditLines: null,
  creditRecs: null,
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
