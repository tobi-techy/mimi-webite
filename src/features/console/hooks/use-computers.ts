"use client";

import { useSyncExternalStore } from "react";
import type { Computer } from "@/features/console/content/computers";
import { computersStore } from "@/features/console/lib/computers-store";

export function useComputers(): readonly Computer[] {
  return useSyncExternalStore(computersStore.subscribe, computersStore.get, computersStore.getServer);
}
