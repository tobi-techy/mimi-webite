"use client";

import { useSyncExternalStore } from "react";
import { USES_API } from "@/features/console/api/config";
import { DEMO_VERSION, seedState } from "@/features/console/demo/seed";
import type { Conversation, DemoState, Message } from "@/features/console/demo/types";

/**
 * The console demo store: one plain object, saved to localStorage after every change until the
 * demo is reset. Server render and first client render both use the seed, then `hydrateDemo()`
 * swaps in the saved copy (so markup never mismatches).
 *
 * In the demo build (USES_API) the sample threads are held back until the API answers, so the
 * first paint is a skeleton rather than sample threads that then swap out; if the API cannot be
 * reached they come back (`restoreSampleConversations`).
 */
const KEY = "mimi-console-demo";
const SEED: DemoState = USES_API ? { ...seedState(), conversations: [] } : seedState();
let state: DemoState = SEED;
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

export function getDemo(): DemoState {
  return state;
}

function emit() {
  listeners.forEach((l) => l());
}

/**
 * True once threads come from the MIMI-AGENT API (demo build). The sample demo is then neither
 * saved nor restored: the API is the source of truth, and the saved sample copy stays as it was
 * for the fallback.
 */
let apiBacked = false;
export const isApiBacked = () => apiBacked;

function save() {
  if (typeof window === "undefined" || apiBacked) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode: the demo lasts for this visit */
    }
  }, 120);
}

export function setDemo(update: (s: DemoState) => DemoState) {
  state = update(state);
  emit();
  save();
}

/** Loads the saved demo once on the client. Anything mid-animation comes back settled. */
let hydrated = false;
export function hydrateDemo() {
  if (hydrated || apiBacked || USES_API) return;
  hydrateSaved();
}

/** The API could not be reached on first load: show the sample threads (and the saved copy). */
export function restoreSampleConversations() {
  if (apiBacked) return;
  state = { ...state, conversations: seedState().conversations };
  emit();
  hydrateSaved();
}

function hydrateSaved() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as DemoState;
    if (saved.version !== DEMO_VERSION) return;
    state = {
      ...saved,
      /* reasoning still streaming and steps still running when the page closed come back settled */
      conversations: saved.conversations.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.kind === "thought" && m.live ? { ...m, live: false, secs: m.secs ?? 3 } : m.kind === "step" && m.state === "run" ? { ...m, state: "done" } : m,
        ),
        plan: c.plan && { ...c.plan, items: c.plan.items.map((it) => (it.state === "run" ? { ...it, state: "done" } : it)) },
      })),
      autos: saved.autos ?? state.autos,
      typing: null,
      sideTyping: false,
      draft: null,
      playing: false,
      active: state.active,
      computer:
        saved.computer.status === "live" && !saved.computer.steps.some((s) => s.state === "run")
          ? { ...saved.computer, status: "done" }
          : saved.computer,
    };
    emit();
  } catch {
    /* corrupt copy: keep the seed */
  }
}

/** Shows the API's threads instead of the sample ones (the rest of the demo state stays as it is). */
export function setApiConversations(conversations: Conversation[]) {
  apiBacked = true;
  hydrated = true;
  state = { ...state, conversations };
  emit();
}

export function resetDemoState() {
  state = seedState();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Read a slice of the demo. Selectors must return stable references (state slices, not new objects). */
export function useDemo<T>(select: (s: DemoState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(SEED),
  );
}

/* ---------- small immutable helpers ---------- */

export function patchConversation(slug: string, patch: (c: Conversation) => Conversation) {
  setDemo((s) => ({ ...s, conversations: s.conversations.map((c) => (c.slug === slug ? patch(c) : c)) }));
}

export function patchMessage(slug: string, id: string, patch: (m: Message) => Message) {
  patchConversation(slug, (c) => ({ ...c, messages: c.messages.map((m) => (m.id === id ? patch(m) : m)) }));
}

export function nextId(prefix = "m"): string {
  let out = "";
  setDemo((s) => {
    out = `${prefix}${s.counter + 1}`;
    return { ...s, counter: s.counter + 1 };
  });
  return out;
}

export const findConversation = (s: DemoState, slug: string) => s.conversations.find((c) => c.slug === slug);
