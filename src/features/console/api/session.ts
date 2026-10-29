"use client";

import { mimiApi } from "@/features/console/api/client";

/**
 * The demo session token. Kept in sessionStorage only (gone when the tab closes), sent only in the
 * Authorization header, never logged and never put in a URL.
 */
const KEY = "mimi-console-session";
type Session = { token: string; expiresAt: string };
let session: Session | null = null;

export function readSession(): Session | null {
  if (session) return session;
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    if (parsed && typeof parsed.token === "string" && parsed.token.startsWith("mimi_demo_")) {
      session = { token: parsed.token, expiresAt: String(parsed.expiresAt ?? "") };
    }
  } catch {
    /* private mode or a bad copy: start a new session */
  }
  return session;
}

export function writeSession(s: Session | null) {
  session = s;
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode: the session lasts for this page */
  }
}

export async function newSession(): Promise<string> {
  const s = await mimiApi.createDemoSession();
  writeSession({ token: s.token, expiresAt: s.expires_at });
  return s.token;
}

export async function sessionToken(): Promise<string> {
  return readSession()?.token ?? newSession();
}
