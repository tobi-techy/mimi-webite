"use client";

import { MimiApiError, mimiApi } from "@/features/console/api/client";
import { apiActive, notify } from "@/features/console/api/live-store";
import { friendlyMessage } from "@/features/console/api/mappers";
import { newSession, readSession, writeSession } from "@/features/console/api/session";
import { authed, openTurns, pending, refresh, report, resetCaches } from "@/features/console/api/sync";
import { findConversation, getDemo, nextId, patchConversation, patchMessage } from "@/features/console/demo/store";
import type { Conversation, Message } from "@/features/console/demo/types";

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
export async function liveSend(slug: string, text: string): Promise<void> {
  const clean = text.trim();
  if (!clean) return;
  const target = ownerThread()?.slug ?? slug;
  const bubble: Message = { id: nextId("api-me"), kind: "text", from: "me", text: clean, at: Date.now() };
  pending.set(target, [...(pending.get(target) ?? []), bubble]);
  patchConversation(target, (c) => ({ ...c, ago: "now", state: "run", working: true, status: "reading your message", messages: [...c.messages, bubble] }));
  if (target !== slug) addEvent(slug, "Sent to Mimi. Her answer comes in your thread with her.");
  try {
    /* one message id for every attempt: the API dedupes on it, so a quiet retry never doubles a turn */
    const body = { message_id: newMessageId(), source: "owner_message" as const, text: clean };
    const turn = await authed((t) => mimiApi.postTurn(t, body));
    const thread = turn.thread_id || target;
    if (thread !== target) {
      pending.set(thread, [...(pending.get(thread) ?? []), bubble]);
      dropPending(target, bubble.id);
    }
    openTurns.set(turn.turn_id, thread);
  } catch (e) {
    dropPending(target, bubble.id);
    const err = report(e);
    patchConversation(target, (c) => ({
      ...c,
      state: "idle",
      working: false,
      status: "waiting for your next message",
      messages: c.messages.filter((m) => m.id !== bubble.id),
    }));
    addEvent(target, `Not sent: “${clean.length > 60 ? `${clean.slice(0, 59)}…` : clean}”. ${friendlyMessage(err.kind, err.detail)}`);
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
