"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MimiApiError } from "@/features/console/api/client";
import { disconnect, finishConnect, listConnectors, readConnection, startConnect } from "@/features/console/api/connectors";
import { useLive } from "@/features/console/api/live-store";
import { friendlyMessage } from "@/features/console/api/mappers";
import { retryLive } from "@/features/console/api/sync";
import type { ApiConnectorRead } from "@/features/console/api/types";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { ConnectorLogo } from "@/features/console/components/settings/ConnectorLogo";
import { Button } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Note } from "@/features/console/components/ui/Note";
import { connectors } from "@/features/console/content/connectors";
import { callbackParams, type ToolkitView } from "@/features/console/lib/connector-state";

/* the brand mark for a toolkit, when the console has one */
const LOGO_KEY: Record<string, string> = { ZOHO_BOOKS: "zoho", ZOHO: "zoho", GOOGLESHEETS: "googlesheets" };
const logoOf = (t: ToolkitView) => ({ ...(connectors.find((c) => c.key === LOGO_KEY[t.toolkit]) ?? {}), name: t.label }) as (typeof connectors)[number];

const say = (e: unknown): string =>
  e instanceof MimiApiError
    ? e.status === 502 || e.status === 503
      ? `The tool's service didn't answer: ${e.detail || "try again in a minute"}.`
      : e.status === 404
        ? "This server doesn't have that connector route yet."
        : e.status === 422
          ? e.detail || "That connect link isn't valid any more. Start the connect again."
          : friendlyMessage(e.kind, e.detail)
    : e instanceof Error
      ? e.message
      : "Something went wrong.";

const dateOf = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Settings > Connected tools in the API build. Lists what the API has, with each tool's real state;
 * Connect starts the real consent flow, the return from it is finished on the API, Check reads live
 * from the account, Disconnect revokes it. A tool this server cannot connect yet says so and its
 * button stays off: nothing here is a stand-in.
 */
export function LiveConnectorsView() {
  const ready = useLive((s) => s.status === "ready");
  const failed = useLive((s) => s.status === "fallback");
  const [list, setList] = useState<ToolkitView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [reads, setReads] = useState<Record<string, ApiConnectorRead | string>>({});
  const callbackDone = useRef(false);
  /* the consent return's parameters: kept in state (and in the URL) until the finish call succeeds */
  const [callback, setCallback] = useState<{ state: string; connected_account_id: string; status: string } | null>(null);
  /* newest list request issued: a slower earlier one must not commit after it */
  const seq = useRef(0);

  const load = useCallback(async (signal?: AbortSignal): Promise<ToolkitView[] | null> => {
    /* only the newest list request may commit: a slow first read must not undo a finished connect */
    const n = ++seq.current;
    setError(null);
    try {
      const next = await listConnectors(signal);
      if (n !== seq.current) return null;
      setList(next);
      return next;
    } catch (e) {
      if (e instanceof DOMException) return null;
      if (n === seq.current) setError(say(e));
      return null;
    }
  }, []);

  const check = useCallback(async (id: string) => {
    setBusy(`read:${id}`);
    try {
      const r = await readConnection(id);
      setReads((m) => ({ ...m, [id]: r }));
    } catch (e) {
      setReads((m) => ({ ...m, [id]: say(e) }));
    } finally {
      setBusy(null);
    }
  }, []);

  /* Finishes the consent return on the API. The URL is cleared only once this succeeds, so a
     failure can be retried (from the note) or by reloading the page with the parameters still on. */
  const finish = useCallback(
    async (p: { state: string; connected_account_id: string; status: string }) => {
      setBusy("callback");
      try {
        const r = await finishConnect(p);
        callbackDone.current = true;
        setCallback(null);
        window.history.replaceState(null, "", window.location.pathname);
        setNote("Connected. Mimi is reading from it now.");
        await load();
        await check(r.connection_id);
      } catch (e) {
        setNote(say(e));
      } finally {
        setBusy(null);
      }
    },
    [load, check],
  );

  /* back from the tool's consent page: pick the parameters up here and hand them to `finish` */
  useEffect(() => {
    if (!ready || callbackDone.current || callback) return;
    const p = callbackParams(window.location.search);
    if (!p) return;
    if (p.status && !/success|active/i.test(p.status)) {
      callbackDone.current = true;
      window.history.replaceState(null, "", window.location.pathname);
      setNote("The tool didn't finish connecting, so nothing changed.");
      return;
    }
    setCallback(p);
  }, [ready, callback]);

  useEffect(() => {
    if (!ready || !callback || callbackDone.current) return;
    void finish(callback);
  }, [ready, callback, finish]);

  useEffect(() => {
    if (!ready) return;
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [ready, load]);

  async function connect(t: ToolkitView) {
    setBusy(`connect:${t.toolkit}`);
    setNote(null);
    try {
      window.location.assign(await startConnect(t.toolkit));
    } catch (e) {
      setNote(say(e));
      setBusy(null);
    }
  }

  async function drop(t: ToolkitView) {
    if (!t.connectionId) return;
    setBusy(`drop:${t.toolkit}`);
    setConfirm(null);
    try {
      await disconnect(t.connectionId);
      /* the note follows the reloaded list: a toolkit can have more than one account connected */
      const after = await load();
      const still = after?.find((x) => x.toolkit === t.toolkit);
      setNote(
        still?.state === "connected"
          ? `That ${t.label} account was disconnected. Another one is still connected, so Mimi still reads ${t.label}.`
          : `${t.label} disconnected. Mimi no longer reads it.`,
      );
    } catch (e) {
      setNote(say(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="x-shead">
        <h1 className="x-title">Connected tools</h1>
      </div>
      <p className="x-sub">Connect the tools you already use. Mimi reads them only after you connect them here.</p>
      {note && (
        <Note>
          <span>{note}</span>
          {callback && (
            <Button size="sm" variant="ghost" onClick={() => void finish(callback)} disabled={busy === "callback"}>
              Try again
            </Button>
          )}
        </Note>
      )}
      {failed ? (
        <div className="x-void-wrap">
          <EmptyState>Mimi can&apos;t be reached right now, so your tools can&apos;t be shown.</EmptyState>
          <Button onClick={() => void retryLive()}>Retry</Button>
        </div>
      ) : error ? (
        <div className="x-void-wrap">
          <EmptyState>{error}</EmptyState>
          <Button onClick={() => void load()}>Retry</Button>
        </div>
      ) : !list ? (
        <SkeletonRows count={4} />
      ) : !list.length ? (
        <EmptyState>No tools are available on this server yet.</EmptyState>
      ) : (
        <section className="x-ag" aria-label="Tools">
          <div className="x-ag__rows">
            {list.map((t) => {
              const read = t.connectionId ? reads[t.connectionId] : undefined;
              /* the reason must not repeat the lead-in: the server's own words may already say it */
              const why = (t.unavailable ?? "").replace(/^not available yet[.\s]*/i, "").trim();
              const line =
                t.state === "connected"
                  ? `Connected${t.connectedAt ? ` since ${dateOf(t.connectedAt)}` : ""} · ${t.blurb}`
                  : t.connectable
                    ? t.state === "revoked"
                      ? `Disconnected · ${t.blurb}`
                      : t.blurb
                    : why
                      ? `Not available yet. ${why}`
                      : "Not available yet.";
              return (
                <div key={t.toolkit} className="x-app x-app--row x-app--live" aria-label={`${t.label}: ${line}`}>
                  <ConnectorLogo connector={logoOf(t)} size="s" />
                  <b>{t.label}</b>
                  <small>{line}</small>
                  <span className="x-app__acts">
                    {t.state === "connected" ? (
                      confirm === t.toolkit ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                            Keep
                          </Button>
                          <Button size="sm" onClick={() => void drop(t)} disabled={!!busy}>
                            Disconnect {t.label}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => void check(t.connectionId!)} disabled={!!busy}>
                            {busy === `read:${t.connectionId}` ? "Reading" : "Check"}
                          </Button>
                          <Button size="sm" onClick={() => setConfirm(t.toolkit)} disabled={!!busy}>
                            {busy === `drop:${t.toolkit}` ? "Disconnecting" : "Disconnect"}
                          </Button>
                        </>
                      )
                    ) : (
                      <Button size="sm" variant={t.connectable ? "primary" : undefined} onClick={() => void connect(t)} disabled={!t.connectable || !!busy}>
                        {busy === `connect:${t.toolkit}` ? "Opening" : t.connectable ? "Connect" : "Not available yet"}
                      </Button>
                    )}
                  </span>
                  {read && (
                    <div className="x-app__read" role="status">
                      {typeof read === "string" ? (
                        <p>{read}</p>
                      ) : (
                        <>
                          <p>{read.summary}</p>
                          {read.items.length > 0 && (
                            <ul>
                              {read.items.slice(0, 5).map((it) => (
                                <li key={`${it.label}${it.detail ?? ""}`}>
                                  {it.label}
                                  {it.detail ? <span> · {it.detail}</span> : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
