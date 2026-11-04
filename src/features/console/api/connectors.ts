"use client";

import { mimiApi } from "@/features/console/api/client";
import { authed } from "@/features/console/api/sync";
import type { ApiConnectorCallback, ApiConnectorRead } from "@/features/console/api/types";
import { safeRedirect, toolkitView, type ToolkitView } from "@/features/console/lib/connector-state";

/**
 * Settings > Connected tools on the MIMI-AGENT API (sandbox and production alike):
 * GET /v1/connectors, POST /v1/connectors/{toolkit}/connect, GET /v1/connectors/callback,
 * GET /v1/connectors/{id}/read, DELETE /v1/connectors/{id}. Every call is real; errors are thrown
 * (MimiApiError) for the view to say plainly. There is no local stand-in for a connection.
 */

export async function listConnectors(signal?: AbortSignal): Promise<ToolkitView[]> {
  const r = await authed((t) => mimiApi.connectors(t, { signal }));
  return r.connectors.map(toolkitView);
}

/** Starts the real connect flow: returns the consent page to send the browser to. */
export async function startConnect(toolkit: string): Promise<string> {
  const r = await authed((t) => mimiApi.connect(t, toolkit));
  const url = safeRedirect(r.redirect_url);
  if (!url) throw new Error("This server didn't return a real sign-in page for that tool, so nothing was connected.");
  return url;
}

/** Composio sent the owner back: the API checks the signed state and saves the connection. */
export function finishConnect(p: { state: string; connected_account_id: string; status: string }): Promise<ApiConnectorCallback> {
  return authed((t) => mimiApi.connectorCallback(t, p));
}

/** A live read from the connected account (what Mimi can see there now). */
export function readConnection(connectionId: string, signal?: AbortSignal): Promise<ApiConnectorRead> {
  return authed((t) => mimiApi.connectorRead(t, connectionId, { signal }));
}

export async function disconnect(connectionId: string): Promise<void> {
  await authed((t) => mimiApi.disconnect(t, connectionId));
}
