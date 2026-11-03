import assert from "node:assert/strict";
import { test } from "node:test";
import { demoPhone, suggestLimit, tourOrder } from "./tour-figures.ts";
import { hideKeys } from "../api/mappers.ts";

test("hideKeys takes invoice numbers, Zoho references and book ids out of plain text", () => {
  assert.equal(
    hideKeys("Recorded Mama Chidi Kiosk's ₦34,950 payment in Zoho Books against INV-56-9034. You can undo it."),
    "Recorded Mama Chidi Kiosk's ₦34,950 payment in Zoho Books. You can undo it.",
  );
  assert.equal(hideKeys("Zoho reference mimi-zoho_payment:pay-ss-6248cc7d219c4ce6"), "Zoho");
  assert.equal(hideKeys("Recorded (zfake_da2ae6d908fe73b1)."), "Recorded.");
  assert.equal(hideKeys("Would send Mama Chidi Kiosk the receipt for dlv-56-9034"), "Would send Mama Chidi Kiosk the receipt");
  assert.equal(hideKeys("No ids here, ₦7,231,000 overdue."), "No ids here, ₦7,231,000 overdue.");
});

test("demoPhone rebuilds the demo book's synthetic number from its last four digits", () => {
  assert.equal(demoPhone("***0134"), "+2340000000134");
  assert.equal(demoPhone(""), null);
  assert.equal(demoPhone("***12"), null);
});

test("suggestLimit matches the API: Yemisi & Sons, ₦630,000 limit, suggested ₦800,000, four reasons", () => {
  const payments = [
    { paid_on: "2026-10-23", amount_ngn: 135000, verified: false },
    { paid_on: "2026-10-19", amount_ngn: 180000, verified: true },
    { paid_on: "2026-06-01", amount_ngn: 99000, verified: true },
  ];
  const order = tourOrder(770200, 630000);
  assert.equal(order, 25000);
  const r = suggestLimit({ limit: 630000, owed: 770200, order, overdue: 635500, overdueDays: 47, payments });
  assert.equal(r.suggested, 800000);
  assert.equal(r.reasons.length, 4);
  assert.match(r.reasons[0]!, /takes it to ₦795,200, ₦165,200 over its ₦630,000 limit/);
  assert.equal(r.reasons[1], "1 of 2 payments in the last 90 days were confirmed by the bank.");
  assert.equal(r.reasons[3], "₦635,500 is overdue, oldest 47 days late.");
  assert.ok(r.reasons.every((x) => !/shop-|—/.test(x)));
});

test("tourOrder takes a shop under its limit just over it", () => {
  assert.equal(tourOrder(500000, 630000), 155000);
});
