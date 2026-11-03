import type { ApiConnectorToolkit } from "../api/types";

/**
 * Settings > Connected tools in the API build (sandbox and production run the same code). Pure, so
 * `npm run test:console` covers it. Nothing here pretends: a tool is connected only when the API
 * lists an active connection for it, and Connect is offered only when the API says its connect flow
 * is really there (a Composio key and an auth config on that server).
 */

export type ToolkitView = {
  toolkit: string;
  label: string;
  blurb: string;
  state: "connected" | "revoked" | "off";
  connectionId?: string;
  connectedAt?: string;
  /** Connect can start a real OAuth flow on this server. */
  connectable: boolean;
  /** Why it cannot, in plain words, when it cannot. */
  unavailable?: string;
  reads: number;
  writes: number;
};

const DEAD = /revoked|failed|expired|deleted|inactive/i;

export function toolkitView(t: ApiConnectorToolkit): ToolkitView {
  const active = t.connections.find((c) => !c.revoked_at && !DEAD.test(c.status));
  const revoked = !active && t.connections.length > 0;
  const connect = t.connect;
  /* an API without the `connect` field predates real connect flows: treat it as not available */
  const connectable = !!connect?.available;
  const unavailable = connectable ? undefined : connect?.reason?.trim() || "Not available yet on this server.";
  return {
    toolkit: t.toolkit,
    label: t.label,
    blurb: t.blurb,
    state: active ? "connected" : revoked ? "revoked" : "off",
    connectionId: active?.connection_id,
    connectedAt: active?.connected_at || undefined,
    connectable,
    unavailable,
    reads: t.reads.length,
    writes: t.writes.length,
  };
}

/** Where Connect may send the browser: a real https consent page, never a placeholder host. */
export function safeRedirect(url: string | undefined | null): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".example") || host === "example.com" || host.endsWith(".example.com") || host.endsWith(".invalid") || host.endsWith(".test")) return null;
  return u.toString();
}

/**
 * The query Composio adds when it sends the owner back to Settings after consent: our signed state
 * and the connected account id (Composio has used both `connected_account_id` and
 * `connectedAccountId`). Null when the page was opened normally.
 */
export function callbackParams(search: string): { state: string; connected_account_id: string; status: string } | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const id = q.get("connected_account_id") || q.get("connectedAccountId") || "";
  const state = q.get("state") || "";
  if (!id && !state) return null;
  return { state, connected_account_id: id, status: q.get("status") || "" };
}
