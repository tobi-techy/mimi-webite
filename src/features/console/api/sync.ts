"use client";

import { MimiApiError, isAbort, mimiApi } from "@/features/console/api/client";
import { USES_API } from "@/features/console/api/config";
import { getLive, notify, setLive } from "@/features/console/api/live-store";
import { friendlyMessage, inFlight, liveActivity, mapCreditLines, mapCreditRecs, mapShop, mapThread, mapThreadSummary } from "@/features/console/api/mappers";
import { newSession, sessionToken, writeSession } from "@/features/console/api/session";
import type { ApiApproval, ApiCredit, ApiShop, ApiThreadDetail, ApiThreadSummary } from "@/features/console/api/types";
import type { Shop } from "@/features/console/content/shops";
import { getDemo, isApiBacked, setApiConversations, setDemo, restoreSampleConversations } from "@/features/console/demo/store";
import type { Conversation, Message } from "@/features/console/demo/types";

/**
 * Reads the API into the console and keeps it fresh.
 *
 * Polling runs only while something is happening (a turn the owner sent, or a thread the API
 * says is running): about once a second, so Mimi's steps show as they arrive. It stops when the
 * turn finishes and while the tab is hidden; coming back to the tab refreshes once.
 *
 * The API polls rather than streams. New replies get their arrival time as `at`, which is what
 * makes the chat reveal them word by word (Messages.tsx `Streamed`). A future SSE stream only has
 * to call `applyThread` with each new detail: the reveal and the thinking line follow from it.
 */

const FAST_MS = 1000;

/* ---------- caches ---------- */

const details = new Map<string, { sig: string; detail: ApiThreadDetail }>();
let approvals: ApiApproval[] = [];
let shopRows: ApiShop[] = [];
let credit: ApiCredit | null = null;
let threads: ApiThreadSummary[] = [];
/** Messages the owner sent that the API has not stored yet, per thread. */
export const pending = new Map<string, Message[]>();
/**
 * Attachments sent from this tab, by their API message id ("in:console-…"): the thread shows these
 * (with their local preview) in place of the API's copy. Their blob: URLs are revoked on reset.
 */
export const localMedia = new Map<string, Message>();
/** Turns sent from this console that have not finished: turn id to thread id. */
export const openTurns = new Map<string, string>();
/** Message ids already on screen, and when each new one arrived (drives the reveal). */
const seen = new Set<string>();
const arrived = new Map<string, number>();
let firstPaint = true;

const localUrls = (m: Message): string[] =>
  m.kind === "photos" ? m.photos.filter((u) => u.startsWith("blob:")) : m.kind === "voice" && m.audio?.from === "local" ? [m.audio.url] : m.kind === "file" && m.local ? [m.local] : [];

function revokeLocal() {
  if (typeof URL === "undefined" || !URL.revokeObjectURL) return;
  const all = [...localMedia.values(), ...[...pending.values()].flat()];
  for (const u of new Set(all.flatMap(localUrls))) URL.revokeObjectURL(u);
}

/** An attachment still uploading, or one that failed (Retry): kept when its thread's turn ends. */
const keeps = (m: Message) => (m.kind === "photos" || m.kind === "voice" || m.kind === "file") && !!m.upload && m.upload.state !== "sending";

export function resetCaches() {
  revokeLocal();
  localMedia.clear();
  details.clear();
  approvals = [];
  shopRows = [];
  credit = null;
  threads = [];
  pending.clear();
  openTurns.clear();
  seen.clear();
  arrived.clear();
  firstPaint = true;
}

/* ---------- auth ---------- */

/** Runs a call with the session token; an expired session is replaced once and the call retried. */
export async function authed<T>(run: (t: string) => Promise<T>): Promise<T> {
  const t = await sessionToken();
  try {
    return await run(t);
  } catch (e) {
    if (e instanceof MimiApiError && (e.kind === "expired" || e.kind === "unauthorized")) {
      writeSession(null);
      resetCaches();
      const fresh = await newSession();
      notify("expired", friendlyMessage("expired"));
      return run(fresh);
    }
    throw e;
  }
}

/** Shows a failure as plain words (toast and the note on Mimi's thread). Returns the error. */
export function report(e: unknown): MimiApiError {
  const err = e instanceof MimiApiError ? e : new MimiApiError(-1, "");
  notify(err.kind, friendlyMessage(err.kind, err.detail));
  return err;
}

/* ---------- publishing into the demo store ---------- */

/** New helper replies and steps get their arrival time, so the chat reveals them as they land. */
function stamp(c: Conversation, now: number): Conversation {
  let changed = false;
  const messages = c.messages.map((m) => {
    if (m.kind !== "text" && m.kind !== "step" && m.kind !== "card" && m.kind !== "system") return m;
    if (!seen.has(m.id)) {
      seen.add(m.id);
      if (!firstPaint) arrived.set(m.id, now);
    }
    const at = arrived.get(m.id);
    if (at === undefined) return m;
    changed = true;
    return { ...m, at };
  });
  return changed ? { ...c, messages } : c;
}

/**
 * A thread is working while the API says so, while its detail has a queued or running turn, or
 * while a message the owner sent is not stored yet. The thinking line follows exactly this, so it
 * clears in the same frame the reply lands.
 */
function running(t: ApiThreadSummary, d?: ApiThreadDetail): boolean {
  if (t.status === "running") return true;
  if (d && liveActivity(d) !== null) return true;
  const mine = pending.get(t.thread_id);
  if (!mine?.length) return false;
  const stored = { ids: new Set(d?.messages.map((m) => m.message_id) ?? []), texts: new Set(d?.messages.map((m) => m.text) ?? []) };
  return mine.some((m) => inFlight(m, stored));
}

/** Polling keeps going for these even before the summary says running. */
const watched = (t: ApiThreadSummary) => (pending.get(t.thread_id) ?? []).some((m) => !keeps(m)) || [...openTurns.values()].includes(t.thread_id);

function publish() {
  const now = Date.now();
  let typing: { slug: string; who: Conversation["helper"] } | null = null;
  const convs = threads.map((t) => {
    const d = details.get(t.thread_id)?.detail;
    let c = d ? mapThread(d, approvals, now, pending.get(t.thread_id), localMedia) : mapThreadSummary(t, now);
    if (running(t, d)) {
      const doing = (d && liveActivity(d)) ?? "reading your message";
      c = { ...c, state: "run", working: true, status: doing };
      if (!typing || c.api?.kind === "owner") typing = { slug: c.slug, who: c.helper };
    }
    return stamp(c, now);
  });
  firstPaint = false;
  setApiConversations(convs);
  const was = getDemo().typing;
  if (was?.slug !== (typing as { slug: string } | null)?.slug || (was && !typing)) setDemo((s) => ({ ...s, typing }));
}

function publishBook() {
  const shops = shopRows.map((s) => mapShop(s));
  const prev = getLive();
  setLive({
    shops,
    creditLines: credit ? mapCreditLines(credit, shops) : prev.creditLines,
    creditRecs: credit ? mapCreditRecs(credit) : prev.creditRecs,
  });
}

const sigOf = (t: ApiThreadSummary) => `${t.last_at}|${t.messages}|${t.status}|${t.pending_approvals}|${t.helper}`;

async function refreshThreads(t: string, signal?: AbortSignal) {
  const [list, appr] = await Promise.all([mimiApi.threads(t, { signal }), mimiApi.approvals(t, { signal })]);
  approvals = appr.approvals;
  threads = list.threads;
  /* running threads are always re-read: their steps arrive without changing the summary */
  const stale = list.threads.filter((x) => details.get(x.thread_id)?.sig !== sigOf(x) || running(x, details.get(x.thread_id)?.detail) || watched(x));
  await Promise.all(
    stale.map(async (x) => {
      details.set(x.thread_id, { sig: sigOf(x), detail: await mimiApi.thread(t, x.thread_id, { signal }) });
    }),
  );
  publish();
}

async function refreshBook(t: string, signal?: AbortSignal) {
  const [s, c] = await Promise.all([mimiApi.shops(t, { signal }), mimiApi.credit(t, { signal })]);
  shopRows = s.shops;
  credit = c;
  publishBook();
}

/** One shop with its payments and open invoices, for the drawer. Aborted when the drawer closes. */
export async function loadShop(id: string, signal: AbortSignal): Promise<Shop | null> {
  try {
    const d = await authed((t) => mimiApi.shop(t, id, { signal }));
    const shop = mapShop(d.shop, d);
    setLive({ shopDetails: { ...getLive().shopDetails, [id]: shop } });
    return shop;
  } catch (e) {
    if (!isAbort(e)) report(e);
    return null;
  }
}

/* ---------- polling ---------- */

let timer: ReturnType<typeof setTimeout> | undefined;
let busy = false;
let again = false;

const hidden = () => typeof document !== "undefined" && document.hidden;
const active = () => openTurns.size > 0 || [...pending.values()].some((l) => l.some((m) => !keeps(m))) || threads.some((t) => t.status === "running");

function schedule() {
  clearTimeout(timer);
  timer = undefined;
  if (active() && !hidden()) timer = setTimeout(() => void refresh(), FAST_MS);
}

/** Re-reads threads and approvals (and the book when asked), then polls again only if work is running. */
export async function refresh(withBook = false): Promise<void> {
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  try {
    await authed(async (t) => {
      for (const [turnId, thread] of [...openTurns]) {
        try {
          const turn = await mimiApi.turn(t, turnId);
          if (["done", "failed", "parked", "cancelled"].includes(turn.state)) {
            openTurns.delete(turnId);
            const left = (pending.get(thread) ?? []).filter(keeps);
            if (left.length) pending.set(thread, left);
            else pending.delete(thread);
            if (turn.state === "failed") notify("other", "Mimi couldn't finish that one. Please ask again in a moment.");
            withBook = true;
          }
        } catch (e) {
          if (!(e instanceof MimiApiError) || e.kind !== "notfound") throw e;
          openTurns.delete(turnId);
        }
      }
      await refreshThreads(t);
      if (withBook) await refreshBook(t);
    });
  } catch (e) {
    report(e);
  } finally {
    busy = false;
    if (again) {
      again = false;
      void refresh(withBook);
    } else schedule();
  }
}

let started = false;

/** Called once by the console shell. Does nothing in the sample and live (signed-out) builds. */
export async function startLive(): Promise<void> {
  if (!USES_API || started) return;
  started = true;
  try {
    await authed(async (t) => {
      await Promise.all([refreshThreads(t), refreshBook(t)]);
    });
    setLive({ status: "ready" });
  } catch (e) {
    const err = e instanceof MimiApiError ? e : new MimiApiError(0, "");
    if (isApiBacked()) {
      /* threads loaded but the book did not: stay on the API and say so */
      setLive({ status: "ready" });
      report(err);
    } else {
      restoreSampleConversations();
      setLive({ status: "fallback" });
      notify(err.kind, friendlyMessage(err.kind === "other" ? "unreachable" : err.kind, err.detail));
    }
  }
  document.addEventListener("visibilitychange", () => {
    if (!hidden() && getLive().status === "ready") void refresh();
    else schedule();
  });
  schedule();
}
