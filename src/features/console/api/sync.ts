"use client";

import { MimiApiError, isAbort, mimiApi, missingRoute } from "@/features/console/api/client";
import { USES_API } from "@/features/console/api/config";
import { getLive, notify, setLive, type LedgerRead } from "@/features/console/api/live-store";
import { capFromMe, type TurnExtras, friendlyMessage, inFlight, liveActivity, koboToNaira, mapCreditLines, mapCreditRecs, mapExposure, mapReturns, mapShop, mapThread, mapThreadSummary, parseApiTime } from "@/features/console/api/mappers";
import { newSession, sessionToken, writeSession } from "@/features/console/api/session";
import type { ApiApproval, ApiCredit, ApiShop, ApiThreadDetail, ApiThreadSummary } from "@/features/console/api/types";
import type { Shop } from "@/features/console/content/shops";
import { mapInbox } from "@/features/console/lib/inbox-view";
import { getDemo, isApiBacked, setApiConversations, setDemo } from "@/features/console/demo/store";
import { taskStore } from "@/features/console/lib/computer-tasks-store";
import type { Conversation, Message, Worker } from "@/features/console/demo/types";

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
/** The API's own sums from GET /v1/shops (mimi/owed.py): the book's definition of owed and overdue. */
let bookTotals: { owed: number; overdue: number } | null = null;
let credit: ApiCredit | null = null;
let threads: ApiThreadSummary[] = [];
/** Messages the owner sent that the API has not stored yet, per thread. */
export const pending = new Map<string, Message[]>();
/**
 * Attachments sent from this tab, by their API message id ("in:console-…"): the thread shows these
 * (with their local preview) in place of the API's copy. Their blob: URLs are revoked on reset.
 */
export const localMedia = new Map<string, Message>();
/**
 * Messages the API refused to take (the demo allowance is used up, or the demo is paused), per
 * thread: the owner's bubble and the note saying why. Shown after the API's own messages and kept
 * until a reset, so a poll never wipes them; they never count as in flight (no polling, no dots).
 */
export const held = new Map<string, Message[]>();
/** Handoffs contract: the card and chips of each finished turn this tab followed, by turn id. */
const turnExtras = new Map<string, TurnExtras>();
/**
 * The chat each owner message was typed in (Collector's, Credit's…), by its console message id:
 * the API files every owner message in the one thread with Mimi, so this keeps it in that
 * helper's chat while its turn is still being routed (and after, when the owner picked her).
 */
export const sentFrom = new Map<string, Worker>();
/** Zoho records and limit changes the owner undid from this tab (approval or change ids). */
export const undone = new Set<string>();
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
  /* the computer tasks hold this session's rows, steps and files: a new session must not see them */
  taskStore.reset();
  localMedia.clear();
  details.clear();
  approvals = [];
  shopRows = [];
  credit = null;
  threads = [];
  pending.clear();
  held.clear();
  turnExtras.clear();
  openTurns.clear();
  sentFrom.clear();
  undone.clear();
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
    let c = d ? mapThread(d, approvals, now, pending.get(t.thread_id), localMedia, turnExtras, undone) : mapThreadSummary(t, now);
    if (sentFrom.size)
      c = {
        ...c,
        messages: c.messages.map((m) => {
          if (m.kind !== "text" || m.from !== "me" || m.to) return m;
          const to = sentFrom.get(m.id.replace(/^api-m:in:/, ""));
          return to ? { ...m, to } : m;
        }),
      };
    const kept = held.get(t.thread_id);
    if (kept?.length) c = { ...c, messages: [...c.messages, ...kept] };
    if (running(t, d)) {
      const doing = (d && liveActivity(d)) ?? "reading your message";
      c = { ...c, state: "run", working: true, status: doing };
      if (!typing || c.api?.kind === "owner") typing = { slug: c.slug, who: c.helper };
    }
    return stamp(c, now);
  });
  firstPaint = false;
  setApiConversations(convs);
  syncTyping(typing);
}

function syncTyping(typing: { slug: string; who: Conversation["helper"] } | null) {
  const was = getDemo().typing;
  if (was?.slug !== (typing as { slug: string } | null)?.slug || (was && !typing)) setDemo((s) => ({ ...s, typing }));
}

function publishBook() {
  const shops = shopRows.map((s) => mapShop(s));
  const prev = getLive();
  setLive({
    shops,
    bookTotals,
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
  /* the API's own totals win over anything the console could add up itself */
  bookTotals =
    typeof s.owed_total_kobo === "number" || typeof s.overdue_total_kobo === "number"
      ? { owed: koboToNaira(s.owed_total_kobo), overdue: koboToNaira(s.overdue_total_kobo) }
      : null;
  credit = c;
  publishBook();
  await Promise.all([refreshLedger(t, signal), refreshInbox(t, signal)]);
}

/** The contract's own ceiling for one read (limit 1..200, default 50). */
const INBOX_LIMIT = 200;

/**
 * The per-helper inbox. It arrives with the API's next release: until this server has the route the
 * 404 reads as "not available yet" (every chat keeps exactly the lines it had, and no task is
 * invented), and it is never announced as an error.
 */
async function refreshInbox(t: string, signal?: AbortSignal) {
  try {
    const { items, helpers } = mapInbox(await mimiApi.inbox(t, { limit: INBOX_LIMIT }, { signal }), parseApiTime);
    setLive({ inbox: items, helperLines: helpers, ledger: { ...getLive().ledger, inbox: "unread" } });
  } catch (e) {
    if (isAbort(e)) return;
    setLive({ ledger: { ...getLive().ledger, inbox: missingRoute(e) ? "missing" : "error" } });
    if (!missingRoute(e)) report(e);
  }
}

/**
 * The returns ledger and the exposure figure. Both arrive with the API's next release: until this
 * server has them the routes answer 404, which reads as "not available yet" on the screen and is
 * never announced as an error.
 */
async function refreshLedger(t: string, signal?: AbortSignal) {
  /* each read records why it has no data: no such route ("missing") or a read that failed ("error") */
  const verdict = (e: unknown): LedgerRead => (missingRoute(e) ? "missing" : "error");
  const ledger = (key: "returns" | "exposure", read: LedgerRead) => setLive({ ledger: { ...getLive().ledger, [key]: read } });
  await Promise.all([
    (async () => {
      try {
        setLive({ returns: mapReturns(await mimiApi.returns(t, { signal })) });
        ledger("returns", "unread");
      } catch (e) {
        if (isAbort(e)) return;
        ledger("returns", verdict(e));
        if (!missingRoute(e)) report(e);
      }
    })(),
    (async () => {
      try {
        setLive({ exposure: mapExposure(await mimiApi.exposure(t, { signal })) });
        ledger("exposure", "unread");
      } catch (e) {
        if (isAbort(e)) return;
        ledger("exposure", verdict(e));
        if (!missingRoute(e)) report(e);
      }
    })(),
  ]);
}

/** One shop with its payments and open invoices, for the drawer. Aborted when the drawer closes. */
export async function loadShop(id: string, signal: AbortSignal): Promise<Shop | null> {
  try {
    const d = await authed((t) => mimiApi.shop(t, id, { signal }));
    const shop = mapShop(d.shop, d);
    setLive({ shopDetails: { ...getLive().shopDetails, [id]: shop } });
    return shop;
  } catch (e) {
    /* a shop the API does not have is not announced: the drawer already says "Shop not found" */
    if (!isAbort(e) && !missingRoute(e)) report(e);
    return null;
  }
}

/**
 * Reads today's demo allowance (GET /v1/me) and shuts or reopens the composer. A turn that ran
 * past the allowance is not refused mid-way, so this runs after each finished turn too. Quiet on
 * failure: a refused send still shuts the composer on its own.
 */
export async function checkCap(t: string): Promise<void> {
  try {
    const me = await mimiApi.me(t);
    const cap = capFromMe(me);
    const was = getLive().cap;
    if (was?.kind !== cap?.kind || was?.text !== cap?.text) setLive({ cap });
  } catch {
    /* the allowance check is a hint; the API still refuses a turn past it */
  }
}

/** Re-publishes what is already read (the tour changed): no network. */
export function republish(): void {
  if (threads.length) publish();
}

/* ---------- polling ---------- */

let timer: ReturnType<typeof setTimeout> | undefined;
let busy = false;
let again = false;
/** A queued pass set `again`: remember a book request that arrived while a read was in flight. */
let againBook = false;
/** A caller that arrived during a pass waits on the pass that runs next, the one that reads the book. */
let queuedPass: Promise<boolean> | null = null;
let settleQueued: ((ok: boolean) => void) | null = null;

const hidden = () => typeof document !== "undefined" && document.hidden;
const active = () => openTurns.size > 0 || [...pending.values()].some((l) => l.some((m) => !keeps(m))) || threads.some((t) => t.status === "running");

function schedule() {
  clearTimeout(timer);
  timer = undefined;
  if (active() && !hidden()) timer = setTimeout(() => void refresh(), FAST_MS);
}

/** Starts one pass, and when a caller arrived during it, the pass they asked for straight after. */
function startPass(withBook: boolean): Promise<boolean> {
  busy = true;
  return runPass(withBook).finally(() => {
    busy = false;
    if (again) {
      again = false;
      const queued = withBook || againBook;
      againBook = false;
      const next = startPass(queued);
      const settle = settleQueued;
      settleQueued = null;
      queuedPass = null;
      /* the caller riding the queue gets the queued pass's own outcome, not this pass's */
      if (settle) void next.then(settle);
    } else schedule();
  });
}

/**
 * Re-reads threads and approvals (and the book when asked), then polls again only if work is
 * running. Resolves true only when the pass that ran for this call really reached the end: a
 * caller that arrives while a pass is in flight waits on the pass that runs next, keeping its
 * book request, so it never reports a read that did not happen.
 */
export function refresh(withBook = false): Promise<boolean> {
  if (busy) {
    again = true;
    if (withBook) againBook = true;
    queuedPass ??= new Promise<boolean>((settle) => {
      settleQueued = settle;
    });
    return queuedPass;
  }
  return startPass(withBook);
}

/** One pass. `ok` is true only when it reached the end without an error. */
async function runPass(withBook: boolean): Promise<boolean> {
  let capCheck = false;
  let ok = false;
  try {
    await authed(async (t) => {
      for (const [turnId, thread] of [...openTurns]) {
        try {
          const turn = await mimiApi.turn(t, turnId);
          if (["done", "failed", "parked", "cancelled"].includes(turn.state)) {
            openTurns.delete(turnId);
            /* older APIs send neither: the plain reply shows as before */
            if (turn.card || turn.chips?.length) turnExtras.set(turnId, { card: turn.card ?? null, chips: turn.chips ?? [] });
            const left = (pending.get(thread) ?? []).filter(keeps);
            if (left.length) pending.set(thread, left);
            else pending.delete(thread);
            if (turn.state === "failed") notify("other", "Mimi couldn't finish that one. Please ask again in a moment.");
            withBook = true;
            capCheck = true;
          }
        } catch (e) {
          if (!(e instanceof MimiApiError) || e.kind !== "notfound") throw e;
          openTurns.delete(turnId);
        }
      }
      await refreshThreads(t);
      if (withBook) await refreshBook(t);
      if (capCheck) await checkCap(t);
      ok = true;
    });
  } catch (e) {
    report(e);
  }
  return ok;
}

let started = false;
let watching = false;

/** Called once by the console shell. Does nothing in the sample and live (signed-out) builds. */
export async function startLive(): Promise<void> {
  if (!USES_API || started) return;
  started = true;
  try {
    await authed(async (t) => {
      await Promise.all([refreshThreads(t), refreshBook(t), checkCap(t)]);
    });
    setLive({ status: "ready", since: Date.now() });
  } catch (e) {
    const err = e instanceof MimiApiError ? e : new MimiApiError(0, "");
    if (isApiBacked()) {
      /* threads loaded but the book did not: stay on the API and say so */
      setLive({ status: "ready", since: Date.now() });
      report(err);
    } else {
      /* no sample data stands in: the console says Mimi can't be reached and offers Retry */
      setLive({ status: "fallback" });
      notify(err.kind, friendlyMessage(err.kind === "other" ? "unreachable" : err.kind, err.detail));
    }
  }
  if (!watching) {
    watching = true;
    document.addEventListener("visibilitychange", () => {
      if (!hidden() && getLive().status === "ready") void refresh();
      else schedule();
    });
  }
  schedule();
}

/** Mimi could not be reached on first load: try again (the Retry button). */
export async function retryLive(): Promise<void> {
  if (!USES_API || getLive().status !== "fallback") return;
  started = false;
  setLive({ status: "connecting", notice: null });
  await startLive();
}
