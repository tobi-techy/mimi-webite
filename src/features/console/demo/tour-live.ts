"use client";

import { MimiApiError, mimiApi } from "@/features/console/api/client";
import { USES_API } from "@/features/console/api/config";
import { getLive } from "@/features/console/api/live-store";
import { hideKeys } from "@/features/console/api/mappers";
import { authed, refresh } from "@/features/console/api/sync";
import type { ApiApproval, ApiShopDetail, ApiTurn } from "@/features/console/api/types";
import { demoPhone, suggestLimit, tourOrder } from "@/features/console/lib/tour-figures";

/**
 * The tour's live side: each scene asks the visitor's own demo copy for the real thing, and answers
 * null when it can't (no API, a cap, a timeout, an unexpected answer), so the tour plays that step
 * from its script instead. Code-only calls are free; three scenes make one model call each (the
 * delivery receipt, the screenshot check, the YES), about ₦65 a tour, inside the demo's allowance.
 *
 * Scene shops are the demo book's own: Mama Chidi Kiosk (shop-035) pays by screenshot for its
 * ₦34,950 delivery; Yemisi & Sons Mini Mart (shop-012) orders over its ₦630,000 limit.
 */

export const PAY_SHOP = "shop-035";
export const ORDER_SHOP = "shop-012";
const SCREENSHOT = "/console-demo/transfer-screenshot.jpg";

export const tourLiveOn = (): boolean => USES_API && getLive().status === "ready";

let run = "";
const idOf = (k: string) => `tour-${run}-${k}`;
export function newRun(): void {
  run = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** Polls a turn until it is done (or failed, or `maxMs` passed). */
async function settle(turnId: string | undefined, maxMs: number): Promise<ApiTurn | null> {
  if (!turnId) return null;
  const t0 = Date.now();
  for (;;) {
    await sleep(1500);
    try {
      const t = await authed((k) => mimiApi.turn(k, turnId));
      if (t.state === "done") return t;
      if (t.state === "failed") return null;
    } catch (e) {
      if (!(e instanceof MimiApiError) || e.status !== 0) return null;
    }
    if (Date.now() - t0 > maxMs) return null;
  }
}

const readyText = (t: ApiTurn | null, channel: string): string | null =>
  t?.replies.find((r) => r.channel === channel && r.status === "ready" && r.text.trim())?.text ?? null;

const quiet = async <T>(f: () => Promise<T>): Promise<T | null> => {
  try {
    return await f();
  } catch {
    return null;
  }
};

/* ---------- scene 1: the morning brief (routine event, answered by code) ---------- */

export async function liveBrief(): Promise<string | null> {
  return quiet(async () => {
    const r = await authed((k) => mimiApi.event(k, { event_id: idOf("brief"), kind: "routine", name: "morning_brief" }));
    const text = readyText(await settle(r.turn_id, 20_000), "owner_console");
    return text && /overdue/i.test(text) ? hideKeys(text) : null;
  });
}

/* ---------- the shops the scenes use ---------- */

export type LiveShop = { id: string; name: string; phone: string | null; detail: ApiShopDetail };

export async function liveShop(id: string): Promise<LiveShop | null> {
  return quiet(async () => {
    const d = await authed((k) => mimiApi.shop(k, id));
    return { id, name: d.shop.name, phone: demoPhone(d.shop.phone_last4), detail: d };
  });
}

/* ---------- scene 2: delivery, screenshot (Likely), bank credit (Confirmed) ---------- */

/** Van 2's delivery to the shop (opens the invoice the screenshot pays). Resolves to the receipt. */
export async function liveDelivery(shopId: string): Promise<string | null> {
  return quiet(async () => {
    const r = await authed((k) => mimiApi.event(k, { event_id: idOf("dlv"), kind: "webhook", name: "delivery_completed", shop_id: shopId }));
    return readyText(await settle(r.turn_id, 45_000), "shop_whatsapp");
  });
}

/** The shop sends the transfer screenshot. Resolves to the payment Proof recorded as Likely. */
export async function liveScreenshot(shop: LiveShop): Promise<{ amount: number; reply: string | null } | null> {
  if (!shop.phone) return null;
  const phone = shop.phone;
  return quiet(async () => {
    const blob = await (await fetch(SCREENSHOT)).blob();
    const media = await authed((k) => mimiApi.upload(k, blob, "image/jpeg"));
    const turn = await authed((k) =>
      mimiApi.postTurn(k, {
        message_id: idOf("shot"),
        source: "shop_message",
        phone,
        text: "Mimi, mo ti transfer o, e check receipt abeg",
        media: { kind: "image", ref: media.ref, mime: media.mime, sha256: media.sha256 },
      }),
    );
    /* the number must land on the shop's own thread, or this is not the demo book */
    if (!turn.thread_id.endsWith(`:shop:${shop.id}`)) return null;
    const done = await settle(turn.turn_id, 75_000);
    if (!done) return null;
    const d = await authed((k) => mimiApi.shop(k, shop.id));
    const p = d.payments.find((x) => (x.proof_level ?? "") === "likely");
    if (!p) return null;
    return { amount: p.amount_ngn ?? Math.round((p.amount_kobo || p.claimed_kobo) / 100), reply: readyText(done, "shop_whatsapp") };
  });
}

/** The bank credit lands. Resolves to the Zoho approval it opened and what the shop was told. */
export async function liveBankCredit(shopId: string, amount: number): Promise<{ approval: ApiApproval; shopText: string | null } | null> {
  return quiet(async () => {
    const r = await authed((k) => mimiApi.event(k, { event_id: idOf("bank"), kind: "webhook", name: "bank_credit", shop_id: shopId, amount_ngn: amount }));
    const done = await settle(r.turn_id, 20_000);
    if (!done) return null;
    const list = await authed((k) => mimiApi.approvals(k));
    const approval = list.approvals.find((a) => a.status === "pending" && (a.kind || a.payload?.kind) === "zoho_payment" && a.payload?.shop_id === shopId);
    void refresh(true);
    return approval ? { approval, shopText: readyText(done, "shop_whatsapp") } : null;
  });
}

/* ---------- scene 3: the Zoho write and its Undo ---------- */

export async function liveZoho(approvalId: string, approve: boolean): Promise<boolean> {
  const ok = await quiet(async () => {
    await authed((k) => mimiApi.decide(k, approvalId, approve));
    return true;
  });
  void refresh(true);
  return !!ok;
}

export async function liveZohoUndo(approvalId: string): Promise<boolean> {
  const ok = await quiet(async () => {
    await authed((k) => mimiApi.undoApproval(k, approvalId));
    return true;
  });
  void refresh(true);
  return !!ok;
}

/* ---------- scene 4: an order over its limit (the book's figures; the limit write is real) ---------- */

export type LiveOrder = { shop: string; shopId: string; owed: number; limit: number; order: number; suggested: number; overdue: number; reasons: string[] };

export function liveOrderOf(s: LiveShop): LiveOrder | null {
  const sh = s.detail.shop;
  const limit = sh.credit_limit_ngn ?? Math.round(sh.credit_limit_kobo / 100);
  const owed = sh.outstanding_ngn ?? Math.round(sh.outstanding_kobo / 100);
  if (!(limit > 0)) return null;
  const order = tourOrder(owed, limit);
  const { suggested, reasons } = suggestLimit({
    limit,
    owed,
    order,
    overdue: sh.overdue_ngn ?? Math.round(sh.overdue_kobo / 100),
    overdueDays: sh.overdue_days ?? 0,
    payments: s.detail.payments.map((p) => ({
      paid_on: p.paid_on,
      amount_ngn: p.amount_ngn ?? Math.round(p.amount_kobo / 100),
      verified: (p.proof_level ?? (p.bank_confirmed ? "verified" : "")) === "verified",
    })),
  });
  return { shop: s.name, shopId: s.id, owed, limit, order, suggested, overdue: sh.overdue_ngn ?? 0, reasons };
}

/** Saves the new limit on the visitor's copy. Resolves to the change id Undo sends back. */
export async function liveLimit(shopId: string, amount: number): Promise<string | null> {
  const r = await quiet(() => authed((k) => mimiApi.setLimit(k, shopId, amount, "Accepted Credit's suggestion for an order over the limit")));
  void refresh(true);
  return r?.change_id ?? null;
}

export async function liveLimitUndo(changeId: string): Promise<boolean> {
  const ok = await quiet(async () => {
    await authed((k) => mimiApi.undoLimit(k, changeId));
    return true;
  });
  void refresh(true);
  return !!ok;
}

/* ---------- scene 5: the shop replies YES to the receipt ---------- */

export async function liveYes(shop: LiveShop): Promise<string | null> {
  if (!shop.phone) return null;
  const phone = shop.phone;
  return quiet(async () => {
    const turn = await authed((k) => mimiApi.postTurn(k, { message_id: idOf("yes"), source: "shop_message", phone, text: "YES" }));
    if (!turn.thread_id.endsWith(`:shop:${shop.id}`)) return null;
    const text = readyText(await settle(turn.turn_id, 45_000), "shop_whatsapp");
    void refresh(true);
    return text;
  });
}
