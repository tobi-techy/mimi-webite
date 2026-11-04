"use client";

import { useEffect } from "react";
import { USES_API } from "@/features/console/api/config";
import { getLive, useLive } from "@/features/console/api/live-store";
import { loadShop } from "@/features/console/api/sync";
import { creditKpis, creditLines, creditRecommendations, type CreditLine, type CreditRecommendation } from "@/features/console/content/credit";
import type { BooksAgreement } from "@/features/console/content/books";
import type { Exposure } from "@/features/console/content/exposure";
import type { Routine } from "@/features/console/content/routines";
import type { ShopReturn } from "@/features/console/content/returns";
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

/**
 * The API build could not reach Mimi on first load (or after a reset that failed): the book pages
 * say that and offer Retry, instead of an empty book, which would read as "you are owed nothing".
 * False in the sample build, while the first read is still running, and once the book has loaded.
 */
export function useUnreachable(): boolean {
  return useLive((s) => USES_API && s.status === "fallback");
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
  const unreachable = useUnreachable();
  /* noughts would be a claim: show no tiles at all when the book could not be read */
  if (loading || unreachable) return null;
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
  const unreachable = useUnreachable();
  /* no summary when there is nothing to summarise: the page says Mimi can't be reached instead */
  if (loading || unreachable) return null;
  /* the sample line is the sample build's only: the API build never prints figures it did not read */
  if (!USES_API && !shops.some((s) => s.live)) return "48 shops · 41 on WhatsApp · ₦4.82m outstanding";
  const owed = shops.reduce((n, s) => n + s.owed, 0);
  const overdue = shops.filter((s) => (s.live?.overdue ?? 0) > 0).length;
  return `${shops.length} shops · ${overdue} overdue · ${nairaShort(owed)} outstanding`;
}

/* stable empty, so screens that copy it into state never loop */
const NO_RETURNS: readonly ShopReturn[] = [];

/** The API's own sums from GET /v1/shops: the book's definition of owed and overdue. */
export function useBookTotals(): { owed: number; overdue: number } | null {
  return useLive((s) => s.bookTotals);
}

/**
 * The returns ledger. `missing` is true when this server has no returns route yet, which the screen
 * shows as "not available yet": an empty list would read as "no returns", and that would be a lie.
 */
export function useReturns(): { returns: readonly ShopReturn[]; loading: boolean; missing: boolean; failed: boolean } {
  const status = useLive((s) => s.status);
  const returns = useLive((s) => s.returns);
  const read = useLive((s) => s.ledger.returns);
  if (status === "connecting") return { returns: NO_RETURNS, loading: true, missing: false, failed: false };
  return { returns: returns ?? NO_RETURNS, loading: false, missing: read === "missing", failed: read === "error" };
}

/** The exposure read failed (not "no such route"): Money at risk says so rather than staying silent. */
export function useExposureFailed(): boolean {
  return useLive((s) => USES_API && s.ledger.exposure === "error");
}

/** Credit exposure from the API, with its own ageing buckets. Null when this server has no route. */
export function useExposure(): Exposure | null {
  return useLive((s) => s.exposure);
}

/* stable empty, so screens that copy it into state never loop */
const NO_ROUTINES: readonly Routine[] = [];

/**
 * Mimi's routines, with the as-of time the API read them. `missing` is true when this server has no
 * routines route yet, which the screen shows as "not available yet": an empty rail would read as
 * "Mimi runs nothing", and that is a lie.
 */
export function useRoutines(): { routines: readonly Routine[]; asOf: string; loading: boolean; missing: boolean; failed: boolean } {
  const status = useLive((s) => s.status);
  const list = useLive((s) => s.routines);
  const read = useLive((s) => s.ledger.routines);
  if (status === "connecting") return { routines: NO_ROUTINES, asOf: "", loading: true, missing: false, failed: false };
  return {
    routines: list?.routines ?? NO_ROUTINES,
    asOf: list?.asOf ?? "",
    loading: false,
    missing: read === "missing",
    failed: read === "error",
  };
}

/**
 * The two books comparison. `missing` again means this server has no route for it; `agreement` null
 * with the route present is a read that has not landed. A screen never treats either as agreement.
 */
export function useBooksAgreement(): { agreed: BooksAgreement | null; loading: boolean; missing: boolean; failed: boolean } {
  const status = useLive((s) => s.status);
  const books = useLive((s) => s.books);
  const read = useLive((s) => s.ledger.books);
  if (status === "connecting") return { agreed: null, loading: true, missing: false, failed: false };
  return { agreed: books, loading: false, missing: read === "missing", failed: read === "error" };
}
