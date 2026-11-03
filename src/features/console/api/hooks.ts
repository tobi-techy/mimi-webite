"use client";

import { useEffect } from "react";
import { USES_API } from "@/features/console/api/config";
import { getLive, useLive } from "@/features/console/api/live-store";
import { loadShop } from "@/features/console/api/sync";
import { creditKpis, creditLines, creditRecommendations, type CreditLine, type CreditRecommendation } from "@/features/console/content/credit";
import { shops as sampleShops, type Shop } from "@/features/console/content/shops";
import { useDemo } from "@/features/console/demo/store";
import type { Conversation } from "@/features/console/demo/types";
import { nairaShort } from "@/features/console/lib/format";

/**
 * One hook per resource. Each returns `loading` (show the skeleton) while the demo build waits for
 * the API, then API data, or the sample data in the sample build and on fallback. Errors never
 * reach a screen raw: they become a plain notice (live-store `notify`) and the last good data stays.
 */

/* stable empties, so screens that copy these into state never loop */
const NO_SHOPS: readonly Shop[] = [];
const NO_LINES: readonly CreditLine[] = [];
const NO_RECS: readonly CreditRecommendation[] = [];

/** Threads (the demo store holds API threads in the demo build). */
export function useThreads(): { conversations: Conversation[]; loading: boolean } {
  const conversations = useDemo((s) => s.conversations);
  const loading = useLive((s) => s.status === "connecting");
  return { conversations, loading };
}

/** The shops list. */
export function useShops(): { shops: readonly Shop[]; loading: boolean } {
  const status = useLive((s) => s.status);
  const live = useLive((s) => s.shops);
  if (status === "connecting") return { shops: NO_SHOPS, loading: true };
  /* the API build never shows sample shops: unreachable reads as empty, with the notice */
  if (USES_API) return { shops: status === "ready" && live ? live : NO_SHOPS, loading: false };
  return { shops: sampleShops, loading: false };
}

/** One API shop for the drawer: the list row at once, then its detail (aborted on close). */
export function useShop(id: string): { shop: Shop | undefined; loading: boolean } {
  const status = useLive((s) => s.status);
  const full = useLive((s) => s.shopDetails[id]);
  const row = useLive((s) => s.shops?.find((x) => x.id === id));
  useEffect(() => {
    if (status !== "ready" || !id || getLive().shopDetails[id]) return;
    const ctrl = new AbortController();
    void loadShop(id, ctrl.signal);
    return () => ctrl.abort();
  }, [status, id]);
  return { shop: full ?? row, loading: status === "connecting" || (!full && !!row) };
}

/** Credit lines and the credit requests to review. */
export function useCreditBook(): { lines: readonly CreditLine[]; recs: readonly CreditRecommendation[]; live: boolean; loading: boolean } {
  const status = useLive((s) => s.status);
  const lines = useLive((s) => s.creditLines);
  const recs = useLive((s) => s.creditRecs);
  if (status === "connecting") return { lines: NO_LINES, recs: NO_RECS, live: true, loading: true };
  if (status === "ready" && lines && recs) return { lines, recs, live: true, loading: false };
  if (USES_API) return { lines: NO_LINES, recs: NO_RECS, live: true, loading: false };
  return { lines: creditLines, recs: creditRecommendations, live: false, loading: false };
}

type Kpi = { value: string; label: string };

/** The four tiles on Credit: sample figures, or totals added up from the API's shops. Null while loading. */
export function useCreditKpis(): readonly Kpi[] | null {
  const { shops, loading } = useShops();
  if (loading) return null;
  if (!USES_API && !shops.some((s) => s.live)) return creditKpis;
  const sum = (f: (s: Shop) => number) => shops.reduce((n, s) => n + f(s), 0);
  return [
    { value: nairaShort(sum((s) => s.owed)), label: "Outstanding" },
    { value: nairaShort(sum((s) => s.live?.overdue ?? 0)), label: "Overdue" },
    { value: nairaShort(sum((s) => s.live?.creditLimit ?? 0)), label: "Credit limits" },
    { value: String(shops.length), label: "Shops" },
  ];
}

/** The line under the Shops title. Null while loading. */
export function useShopsSummary(): string | null {
  const { shops, loading } = useShops();
  if (loading) return null;
  if (!shops.some((s) => s.live)) return "48 shops · 41 on WhatsApp · ₦4.82m outstanding";
  const owed = shops.reduce((n, s) => n + s.owed, 0);
  const overdue = shops.filter((s) => (s.live?.overdue ?? 0) > 0).length;
  return `${shops.length} shops · ${overdue} overdue · ${nairaShort(owed)} outstanding`;
}
