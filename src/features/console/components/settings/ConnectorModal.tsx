"use client";

import { useEffect, useRef, useState } from "react";
import { ConnectorLogo } from "@/features/console/components/settings/ConnectorLogo";
import { Icon } from "@/features/console/components/ui/Icon";
import { connectorPermissions, type Connector } from "@/features/console/content/connectors";
import { useConnected } from "@/features/console/hooks/use-connected";
import { useToast } from "@/features/console/hooks/use-toast";
import { connectorsStore } from "@/features/console/lib/connectors-store";
import { liveConnect, liveDisconnect } from "@/features/console/api/connectors";
import { Button } from "@/features/console/components/ui/Button";

const CONNECT_MS = 900;

/** Connect (or disconnect) one connector: what Mimi may do with it, then a fake OAuth hop. */
export function ConnectorModal({ connector, onClose }: { connector: Connector; onClose: () => void }) {
  const say = useToast();
  const on = useConnected().has(connector.key);
  const [busy, setBusy] = useState(false);
  /* the demo's own connect hop (no consent page from the API) */
  const [hop, setHop] = useState(false);
  const goRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<Element | null>(null);

  useEffect(() => {
    returnTo.current = document.activeElement;
    goRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (returnTo.current instanceof HTMLElement) returnTo.current.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!hop) return;
    const t = window.setTimeout(() => {
      connectorsStore.set(connector.key, true);
      say(`${connector.name} connected`);
      onClose();
    }, CONNECT_MS);
    return () => window.clearTimeout(t);
  }, [hop, connector, onClose, say]);

  async function go() {
    if (!on) {
      setBusy(true);
      /* the API's consent page when it has one; otherwise the demo hop below finishes it */
      const how = await liveConnect(connector.key);
      if (how === "error") setBusy(false);
      else if (how === "local") setHop(true);
      return;
    }
    if (!(await liveDisconnect(connector.key))) return;
    connectorsStore.set(connector.key, false);
    say(`${connector.name} disconnected`);
    onClose();
  }

  return (
    <div className="x-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="x-modal" role="dialog" aria-modal="true" aria-labelledby="connector-title">
        <ConnectorLogo connector={connector} size="l" />
        <h3 id="connector-title">{on ? connector.name : `Connect ${connector.name}`}</h3>
        <p>
          {on ? (
            <span className="x-in">
              <span className="x-on"></span>Connected · What Mimi can do with {connector.name}:
            </span>
          ) : (
            `What Mimi can do with ${connector.name}:`
          )}
        </p>
        <ul>
          {connectorPermissions[connector.category].map((p) => (
            <li key={p}>
              <Icon name="check" />
              {p}
            </li>
          ))}
        </ul>
        <div className="x-btns">
          <Button ref={goRef} variant={on ? "secondary" : "primary"} disabled={busy} onClick={() => void go()}>
            {busy ? (
              <>
                <span className="x-ring" aria-hidden="true"></span>Connecting
              </>
            ) : on ? (
              "Disconnect"
            ) : (
              `Continue to ${connector.name}`
            )}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {on ? "Close" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
