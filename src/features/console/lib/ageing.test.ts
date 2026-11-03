import assert from "node:assert/strict";
import { test } from "node:test";
import { ageingOf, bandOf, reasonOf } from "./ageing.ts";
import type { Shop } from "@/features/console/content/shops";

/** A shop as GET /v1/shops maps it: the money it owes, and what the API says is past due. */
function shop(over: Partial<Shop> & { overdue?: number; overdueDays?: number; limit?: number; open?: number }): Shop {
  const { overdue = 0, overdueDays = 0, limit = 0, open = 0, ...rest } = over;
  return {
    id: "s",
    name: "Shop",
    area: "Oshodi",
    route: "Oshodi",
    owner: "Owner",
    whatsapp: "",
    sellThrough: 0,
    owed: 0,
    score: 0,
    lastPayment: "—",
    status: "o",
    salesThisWeek: 0,
    avgDaysToPay: 0,
    payments: [],
    live: { creditLimit: limit, overdue, overdueDays, openInvoices: open, shopType: "provision store" },
    ...rest,
  };
}

test("a shop falls in the band its oldest unpaid invoice falls in", () => {
  assert.equal(bandOf(0), "d1_30");
  assert.equal(bandOf(1), "d1_30");
  assert.equal(bandOf(30), "d1_30");
  assert.equal(bandOf(31), "d31_60");
  assert.equal(bandOf(60), "d31_60");
  assert.equal(bandOf(61), "d61_90");
  assert.equal(bandOf(90), "d61_90");
  assert.equal(bandOf(91), "d90");
  assert.equal(bandOf(400), "d90");
});

test("overdue money is counted once, in the band of the shop's oldest invoice", () => {
  const shops = [
    shop({ id: "a", owed: 100_000, overdue: 40_000, overdueDays: 10 }),
    shop({ id: "b", owed: 500_000, overdue: 250_000, overdueDays: 45 }),
    shop({ id: "c", owed: 90_000, overdue: 0, overdueDays: 0 }),
  ];
  const age = ageingOf(shops);
  assert.equal(age.owed, 690_000, "every shop's outstanding is counted");
  assert.equal(age.overdue, 290_000);
  assert.equal(age.debtors, 2, "only shops with money past due carry it");
  assert.equal(age.oldest, 45);
  const money = Object.fromEntries(age.bands.map((b) => [b.id, b.money]));
  assert.deepEqual(money, { d1_30: 40_000, d31_60: 250_000, d61_90: 0, d90: 0 });
  const carriers = Object.fromEntries(age.bands.map((b) => [b.id, b.shops]));
  assert.deepEqual(carriers, { d1_30: 1, d31_60: 1, d61_90: 0, d90: 0 });
});

test("the API's own totals win over the rows, so the book keeps one definition", () => {
  const shops = [shop({ id: "a", owed: 100_000, overdue: 40_000, overdueDays: 10 })];
  const age = ageingOf(shops, { owed: 7_231_000, overdue: 7_154_850 });
  assert.equal(age.owed, 7_231_000, "GET /v1/shops owed_total_kobo");
  assert.equal(age.overdue, 7_154_850, "GET /v1/shops overdue_total_kobo");
  assert.equal(age.bands.find((b) => b.id === "d1_30")!.money, 40_000, "the bands still come from the rows");
});

test("the reason names the age, the count and the limit it broke", () => {
  assert.equal(
    reasonOf(shop({ owed: 2_000_000, overdue: 2_387_250, overdueDays: 133, open: 4, limit: 1_700_000 })),
    "133 days past due, 4 unpaid invoices, over its ₦1,700,000 limit",
  );
  assert.equal(
    reasonOf(shop({ owed: 90_000, overdue: 10_000, overdueDays: 1, open: 1, limit: 500_000 })),
    "1 day past due, 1 unpaid invoice",
  );
});
