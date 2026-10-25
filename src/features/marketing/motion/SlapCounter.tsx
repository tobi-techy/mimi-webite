"use client";

import { useSyncExternalStore } from "react";
import { slapStore } from "@/features/marketing/motion/slap-store";

/** "3 stickers": how many stickers the visitor has slapped this visit. */
export function SlapCounter() {
  const n = useSyncExternalStore(slapStore.subscribe, slapStore.get, slapStore.getServer);
  return <span id="slapCount">{n + (n === 1 ? " sticker" : " stickers")}</span>;
}
