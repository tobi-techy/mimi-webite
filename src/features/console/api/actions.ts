"use client";

import { attachLabel, checkAttachment, uploadRefusal, type AttachPurpose } from "@/features/console/api/attachments";
import { MimiApiError, isAbort, mimiApi } from "@/features/console/api/client";
import { apiActive, notify, setLive } from "@/features/console/api/live-store";
import { capText, friendlyMessage } from "@/features/console/api/mappers";
import { newSession, readSession, writeSession } from "@/features/console/api/session";
import { authed, held, localMedia, openTurns, pending, refresh, report, resetCaches } from "@/features/console/api/sync";
import { findConversation, getDemo, nextId, patchConversation, patchMessage } from "@/features/console/demo/store";
import type { Conversation, Message, Upload, VoiceAudio } from "@/features/console/demo/types";

/**
 * What the owner does on API threads. The demo engine hands over to these when a thread or card
 * came from the API. Sending is optimistic (the bubble shows at once, the send is retried quietly);
 * approvals are not: a card only changes after the API says so.
 */

export const isApiThread = (slug: string): boolean => apiActive() && !!findConversation(getDemo(), slug)?.api;
export const isApiCard = (messageId: string): boolean => apiActive() && messageId.startsWith("apr:");

function addEvent(slug: string, text: string) {
  if (!findConversation(getDemo(), slug)) return;
  const id = nextId("api-ev");
  patchConversation(slug, (c) => ({ ...c, messages: [...c.messages, { id, kind: "event", text, at: Date.now() }] }));
}

const ownerThread = (): Conversation | undefined => getDemo().conversations.find((c) => c.api?.kind === "owner");

const newMessageId = () =>
  `console-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

function dropPending(thread: string, id: string) {
  const left = (pending.get(thread) ?? []).filter((m) => m.id !== id);
  if (left.length) pending.set(thread, left);
  else pending.delete(thread);
}

/**
 * The owner sends a message. The API files every owner message in the owner's own thread with
 * Mimi, so a message typed in a shop thread is answered there (the shop thread says so).
 */
export async function liveSend(slug: string, text: string, opts: { assign?: string } = {}): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  const target = ownerThread()?.slug ?? slug;
  const bubble: Message = { id: nextId("api-me"), kind: "text", from: "me", text: clean, at: Date.now() };
  pending.set(target, [...(pending.get(target) ?? []), bubble]);
  patchConversation(target, (c) => ({ ...c, ago: "now", state: "run", working: true, status: "reading your message", messages: [...c.messages, bubble] }));
  if (target !== slug) addEvent(slug, "Sent to Mimi. Her answer comes in your thread with her.");
  try {
    /* one message id for every attempt: the API dedupes on it, so a quiet retry never doubles a turn */
    const body = { message_id: newMessageId(), source: "owner_message" as const, text: clean, ...(opts.assign ? { assign_to: opts.assign } : {}) };
    const turn = await authed((t) => mimiApi.postTurn(t, body));
    const thread = turn.thread_id || target;
    if (thread !== target) {
      pending.set(thread, [...(pending.get(thread) ?? []), bubble]);
      dropPending(target, bubble.id);
    }
    openTurns.set(turn.turn_id, thread);
  } catch (e) {
    dropPending(target, bubble.id);
    const err = e instanceof MimiApiError ? e : new MimiApiError(-1, "");
    if (err.kind === "capped" || err.kind === "paused") {
      /* the demo's allowance is used up: the bubble stays, a note under it says why, the composer shuts */
      const kind = err.kind;
      const text = capText(kind, err.detail);
      const note: Message = { id: nextId("api-cap"), kind: "event", text: `Not sent. ${text}`, at: Date.now(), tone: "stop" };
      held.set(target, [...(held.get(target) ?? []), { ...bubble, read: false }, note]);
      setLive({ cap: { kind, text } });
      patchConversation(target, (c) => ({
        ...c,
        state: "idle",
        working: false,
        status: "waiting for your next message",
        messages: [...c.messages, note],
      }));
      void refresh();
      return;
    }
    report(err);
    patchConversation(target, (c) => ({
      ...c,
      state: "idle",
      working: false,
      status: "waiting for your next message",
      messages: c.messages.filter((m) => m.id !== bubble.id),
    }));
    /* kept with the held messages so the next poll does not wipe it */
    const note: Message = { id: nextId("api-ev"), kind: "event", text: `Not sent: “${clean.length > 60 ? `${clean.slice(0, 59)}…` : clean}”. ${friendlyMessage(err.kind, err.detail)}`, at: Date.now() };
    held.set(target, [...(held.get(target) ?? []), note]);
    patchConversation(target, (c) => ({ ...c, messages: [...c.messages, note] }));
  }
  void refresh();
}

/** Home composer: a new ask goes to Mimi's thread. Returns that thread's slug. */
export function liveStart(text: string): string {
  const slug = ownerThread()?.slug ?? getDemo().conversations[0]?.slug ?? "";
  if (slug) void liveSend(slug, text);
  return slug;
}

/** Approve or decline an approval card. Not optimistic: the card waits (Saving) until the API answers. */
export async function liveDecide(slug: string, cardId: string, approve: boolean): Promise<void> {
  const id = cardId.replace(/^apr:/, "");
  const set = (status: "needs" | "sending") =>
    patchMessage(slug, cardId, (m) => (m.kind === "card" ? { ...m, card: { ...m.card, status } } : m));
  set("sending");
  try {
    await authed((t) => mimiApi.decide(t, id, approve));
  } catch (e) {
    set("needs");
    const err = report(e);
    addEvent(slug, friendlyMessage(err.kind, err.detail));
  }
  /* the card's final state comes from the API, never from here */
  await refresh(true);
}

/** Credit page: accept or dismiss a credit request by its approval. Returns the line for the toast. */
export async function liveDecideCredit(approvalId: string, approve: boolean): Promise<{ ok: boolean; text: string }> {
  try {
    await authed((t) => mimiApi.decide(t, approvalId, approve));
    void refresh(true);
    return { ok: true, text: approve ? "Approved" : "Dismissed" };
  } catch (e) {
    const err = report(e);
    return { ok: false, text: friendlyMessage(err.kind, err.detail) };
  }
}

/** Reset: ends this demo session and starts a fresh copy of Coral Lane Trading. */
export async function liveReset(): Promise<void> {
  try {
    const t = readSession()?.token;
    const s = t ? await mimiApi.resetDemo(t) : await mimiApi.createDemoSession();
    writeSession({ token: s.token, expiresAt: s.expires_at });
  } catch (e) {
    if (!(e instanceof MimiApiError) || (e.kind !== "expired" && e.kind !== "unauthorized")) {
      report(e);
      return;
    }
    writeSession(null);
    try {
      await newSession();
    } catch (e2) {
      report(e2);
      return;
    }
  }
  resetCaches();
  notify("info", "Fresh start: a new copy of Coral Lane Trading.");
  await refresh(true);
}

/* ---------- attachments (photos, voice notes, invoices) ---------- */

type AttachMessage = Extract<Message, { kind: "photos" | "voice" | "file" }>;
/** What a failed attachment needs to try again: its bytes and its turn's message id (the API dedupes on it). */
const retries = new Map<string, { thread: string; blob: Blob; mime: string; messageId: string }>();

const makeUrl = (b: Blob) => (typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(b) : "");

/** Updates an attachment bubble both where the next poll reads it (pending) and on screen. */
function patchAttach(thread: string, id: string, f: (m: AttachMessage) => AttachMessage) {
  const list = pending.get(thread);
  if (list) pending.set(thread, list.map((m) => (m.id === id && (m.kind === "photos" || m.kind === "voice" || m.kind === "file") ? f(m) : m)));
  patchMessage(thread, id, (m) => (m.kind === "photos" || m.kind === "voice" || m.kind === "file" ? f(m) : m));
}

const setUpload = (thread: string, id: string, upload: Upload | undefined) => patchAttach(thread, id, (m) => ({ ...m, upload }));

/**
 * The owner attaches a photo, a voice note or an invoice. Checked here first (type for what it was
 * picked as, at most 10 MB), shown at once as its own bubble with progress, uploaded to the API
 * (POST /v1/media), then sent as a turn that points at it. A failure leaves the bubble with the
 * reason and Retry. Returns the refusal when the file was not accepted (nothing is shown then).
 */
export async function liveAttach(slug: string, file: Blob & { name?: string }, purpose: AttachPurpose, opts: { seconds?: number } = {}): Promise<string | null> {
  const name = file.name ?? "";
  const check = checkAttachment({ name, type: file.type, size: file.size }, purpose);
  if (!check.ok) return check.error;
  const target = ownerThread()?.slug ?? slug;
  const id = nextId("api-att");
  const messageId = newMessageId();
  const apiId = `in:${messageId}`;
  const url = check.kind === "document" ? "" : makeUrl(file);
  const upload: Upload = { state: "uploading", progress: 0 };
  const at = Date.now();
  const bubble: AttachMessage =
    check.kind === "image"
      ? { id, kind: "photos", from: "me", at, label: attachLabel("image", name), photos: url ? [url] : [], apiId, upload }
      : check.kind === "voice"
        ? { id, kind: "voice", from: "me", at, seconds: Math.max(1, Math.round(opts.seconds ?? 0)), caption: attachLabel("voice", name), audio: url ? { from: "local", url } : undefined, apiId, upload }
        : { id, kind: "file", from: "me", at, name: name || "Invoice", mime: check.mime, size: file.size, local: makeUrl(file) || undefined, apiId, upload };
  pending.set(target, [...(pending.get(target) ?? []), bubble]);
  patchConversation(target, (c) => ({ ...c, ago: "now", messages: [...c.messages, bubble] }));
  if (target !== slug) addEvent(slug, "Sent to Mimi. Her answer comes in your thread with her.");
  retries.set(id, { thread: target, blob: file, mime: check.mime, messageId });
  await sendAttach(target, id);
  return null;
}

/** Retry a failed attachment: the same bytes and the same turn message id, so nothing doubles. */
export function liveRetryAttach(slug: string, id: string): void {
  const r = retries.get(id);
  if (!r) return void notify("other", "Mimi lost that file. Attach it again.");
  void sendAttach(r.thread, id);
}

/** Remove an attachment the API refused (its blob: URL goes with it). */
export function liveDropAttach(slug: string, id: string): void {
  const thread = retries.get(id)?.thread ?? ownerThread()?.slug ?? slug;
  retries.delete(id);
  const gone = (pending.get(thread) ?? []).find((m) => m.id === id);
  const left = (pending.get(thread) ?? []).filter((m) => m.id !== id);
  if (left.length) pending.set(thread, left);
  else pending.delete(thread);
  patchConversation(thread, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== id) }));
  if (gone && typeof URL !== "undefined" && URL.revokeObjectURL) {
    const urls = gone.kind === "photos" ? gone.photos : gone.kind === "voice" && gone.audio?.from === "local" ? [gone.audio.url] : gone.kind === "file" && gone.local ? [gone.local] : [];
    for (const u of urls) if (u.startsWith("blob:")) URL.revokeObjectURL(u);
  }
}

async function sendAttach(thread: string, id: string): Promise<void> {
  const r = retries.get(id);
  if (!r) return;
  let last = -1;
  setUpload(thread, id, { state: "uploading", progress: 0 });
  try {
    const media = await authed((t) =>
      mimiApi.upload(t, r.blob, r.mime, {
        onProgress: (p) => {
          const pct = Math.floor(p * 20) * 5; /* every 5%: no re-render per byte */
          if (pct !== last) {
            last = pct;
            setUpload(thread, id, { state: "uploading", progress: pct / 100 });
          }
        },
      }),
    );
    setUpload(thread, id, { state: "sending", progress: 1 });
    patchConversation(thread, (c) => ({ ...c, state: "run", working: true, status: "reading your message" }));
    const body = { message_id: r.messageId, source: "owner_message" as const, text: "", media: { kind: media.kind, ref: media.ref, sha256: media.sha256, mime: media.mime } };
    const turn = await authed((t) => mimiApi.postTurn(t, body));
    retries.delete(id);
    const sent = (pending.get(thread) ?? []).find((m) => m.id === id);
    setUpload(thread, id, undefined);
    if (sent && (sent.kind === "photos" || sent.kind === "voice" || sent.kind === "file")) localMedia.set(`in:${r.messageId}`, { ...sent, upload: undefined });
    openTurns.set(turn.turn_id, turn.thread_id || thread);
  } catch (e) {
    if (isAbort(e)) return;
    const err = e instanceof MimiApiError ? e : new MimiApiError(-1, "");
    const refusal = uploadRefusal(err.status, err.detail);
    const offline = err.kind === "unreachable";
    const words = refusal ?? (offline ? "Mimi can't be reached right now. Check your connection, then Retry." : friendlyMessage(err.kind, err.detail));
    setUpload(thread, id, { state: "failed", progress: 0, error: words, final: !!refusal && err.status !== 422 });
    patchConversation(thread, (c) => ({ ...c, state: "idle", working: false, status: "waiting for your next message" }));
    /* caps, a paused demo or a renewed session also go to the notice line; a refused file or a dropped connection stays on its bubble */
    if (!refusal && !offline) report(err);
  }
  void refresh();
}

/**
 * The bytes behind a voice note or an attachment, through the one API client with the bearer in
 * the header. The caller makes the blob: URL and revokes it when it unmounts.
 */
export async function loadMediaBlob(src: Exclude<VoiceAudio, { from: "local" }>, signal: AbortSignal): Promise<Blob> {
  return authed((t) => (src.from === "voice" ? mimiApi.voice(t, src.id, { signal }) : mimiApi.media(t, src.id, { signal })));
}
