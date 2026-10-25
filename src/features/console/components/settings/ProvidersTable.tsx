"use client";

import { useCallback, useState } from "react";
import { ConnectorModal } from "@/features/console/components/settings/ConnectorModal";
import { ConnectorTable } from "@/features/console/components/settings/ConnectorTable";
import { paymentProviders, type Connector } from "@/features/console/content/connectors";
import { findConnector } from "@/features/console/lib/connectors-store";

const providers = paymentProviders.map(findConnector).filter((c): c is Connector => !!c);

/** Settings > General > Payment providers. */
export function ProvidersTable() {
  const [open, setOpen] = useState<Connector | null>(null);
  const close = useCallback(() => setOpen(null), []);
  return (
    <>
      <ConnectorTable compact items={providers} onOpen={setOpen} />
      {open && <ConnectorModal connector={open} onClose={close} />}
    </>
  );
}
