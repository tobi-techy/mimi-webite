"use client";

import { MimiApiError, mimiApi, missingRoute } from "@/features/console/api/client";
import { USES_API } from "@/features/console/api/config";
import { getLive } from "@/features/console/api/live-store";
import { authed, report } from "@/features/console/api/sync";
import type { ApiConnectorToolkit } from "@/features/console/api/types";
import { connectorsStore } from "@/features/console/lib/connectors-store";

/**
 * Settings > Connected tools on the API (GET /v1/connectors, POST …/{toolkit}/connect,
 * DELETE …/{connection_id}). Only the toolkits the API has (Zoho Books, Google Sheets) go there;
 * every other tool, and every tool when this demo server has no connector routes, keeps the
 * console's own demo switch.
 */

const KEY_OF: Record<string, string> = { ZOHO_BOOKS: "zoho", ZOHO: "zoho", GOOGLESHEETS: "googlesheets" };
const TOOLKIT_OF: Record<string, string> = { zoho: "ZOHO_BOOKS", googlesheets: "GOOGLESHEETS" };

/** Connection id per connector key, for Disconnect. */
const connections = new Map<string, string>();

const onApi = () => USES_API && getLive().status === "ready";
const activeOf = (t: ApiConnectorToolkit) => t.connections.find((c) => !c.revoked_at && !/revoked|failed|expired/i.test(c.status));

/** Reads the API's connectors into the switches. Quiet when the route is not there yet. */
export async function loadLiveConnectors(signal?: AbortSignal): Promise<void> {
  if (!onApi()) return;
  try {
    const r = await authed((t) => mimiApi.connectors(t, { signal }));
    for (const t of r.connectors) {
      const key = KEY_OF[t.toolkit.toUpperCase()];
      if (!key) continue;
      const c = activeOf(t);
      if (c) connections.set(key, c.connection_id);
      else connections.delete(key);
      /* the demo's own copy starts with Zoho on: only an API connection list that has one decides */
      if (c || t.connections.length) connectorsStore.set(key, !!c);
    }
  } catch (e) {
    if (e instanceof DOMException || missingRoute(e) || (e instanceof MimiApiError && e.status === 403)) return;
    report(e);
  }
}

/**
 * Connect: the API's consent page when it has one (the browser goes there and comes back to
 * Settings), else `local` (the console's demo hop). `error` was already shown.
 */
export async function liveConnect(key: string): Promise<"redirect" | "local" | "error"> {
  const toolkit = TOOLKIT_OF[key];
  if (!toolkit || !onApi()) return "local";
  try {
    const r = await authed((t) => mimiApi.connect(t, toolkit));
    if (r.redirect_url && /^https:\/\//.test(r.redirect_url)) {
      window.location.assign(r.redirect_url);
      return "redirect";
    }
    return "local";
  } catch (e) {
    /* no route, or no connector service behind this demo server (502): the demo hop stands in */
    if (missingRoute(e) || (e instanceof MimiApiError && (e.status === 502 || e.status === 503 || e.status === 403))) return "local";
    report(e);
    return "error";
  }
}

/** Disconnect on the API when the connection came from it. Returns false when it failed (already shown). */
export async function liveDisconnect(key: string): Promise<boolean> {
  const id = connections.get(key);
  if (!id || !onApi()) return true;
  try {
    await authed((t) => mimiApi.disconnect(t, id));
    connections.delete(key);
    return true;
  } catch (e) {
    if (missingRoute(e) || (e instanceof MimiApiError && e.status === 404)) {
      connections.delete(key);
      return true;
    }
    report(e);
    return false;
  }
}
