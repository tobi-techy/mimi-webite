"use client";

import { useSyncExternalStore } from "react";
import { connectorsStore } from "@/features/console/lib/connectors-store";

/** Keys of the connectors connected in this demo session. */
export function useConnected(): ReadonlySet<string> {
  return useSyncExternalStore(connectorsStore.subscribe, connectorsStore.get, connectorsStore.getServer);
}
