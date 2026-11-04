/**
 * Two books, where each shop stands (Tobi, 4 Nov 2026). The screen never works out a figure: every
 * amount is the API's own string, and the kobo integers only say which side is higher. These tests
 * hold the four states, hold the direction to words rather than a signed number, and hold a book
 * that sent no figure to "no figure" rather than a nought, which would read as an empty book.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { apartLine, apartShops, booksState, booksWhole, booksWords, notInZoho, orderedShops, zohoOnlyShops } from "./two-books.ts";
import type { BooksAgreement, BooksMoney, BooksShop } from "../content/books.ts";

const money = (o: Partial<BooksMoney> = {}): BooksMoney => ({
  mimi: "",
  zoho: "",
  difference: "",
  mimiKobo: null,
  zohoKobo: null,
  differenceKobo: null,
  ...o,
});

/* the shape of one live row: Zoho reports less than Mimi's book, and the API sends the difference */
const ZOHO_LOW = money({
  mimi: "₦3,497,300",
  zoho: "₦3,400,000",
  difference: "₦97,300",
  mimiKobo: 349730000,
  zohoKobo: 340000000,
  differenceKobo: 9730000,
});

const shop = (name: string, m: BooksMoney): BooksShop => ({ id: name.toLowerCase().replace(/\W+/g, "-"), name, ...m });

test("a difference the API sent is said in words, with the book that is higher", () => {
  assert.equal(booksWords(booksState(ZOHO_LOW)), "Mimi is higher by ₦97,300");
  const zohoHigh = money({
    mimi: "₦3,400,000",
    zoho: "₦3,497,300",
    difference: "₦97,300",
    mimiKobo: 340000000,
    zohoKobo: 349730000,
    differenceKobo: -9730000,
  });
  assert.equal(booksWords(booksState(zohoHigh)), "Zoho Books is higher by ₦97,300");
});

test("the difference itself is the API's string, never one the console worked out", () => {
  /* the two figures and the difference deliberately do not agree: the API's word wins */
  const odd = money({ mimi: "₦10", zoho: "₦4", difference: "₦5", mimiKobo: 1000, zohoKobo: 400, differenceKobo: 600 });
  assert.equal(booksWords(booksState(odd)), "Mimi is higher by ₦5");
  assert.ok(!booksWords(booksState(odd)).includes("6"), "no figure is computed from the kobo integers");
});

test("the same figure on both sides is agreement", () => {
  assert.equal(booksWords(booksState(money({ mimi: "₦1,000,000", zoho: "₦1,000,000", difference: "₦0", differenceKobo: 0 }))), "Agreed");
  assert.equal(
    booksWords(
      booksState(
        money({ mimi: "₦1,000,000", zoho: "₦1,000,000", mimiKobo: 100000000, zohoKobo: 100000000, differenceKobo: 0 }),
      ),
    ),
    "Agreed",
    "equal kobo with no difference string is agreement too",
  );
});

test("a shop only one book knows is its own state, and is never a nought", () => {
  const onlyMimi = booksState(money({ mimi: "₦50,000", mimiKobo: 5000000, zohoKobo: 0 }));
  const onlyZoho = booksState(money({ zoho: "₦50,000", zohoKobo: 5000000, mimiKobo: 0 }));
  assert.deepEqual(onlyMimi, { kind: "only", book: "Mimi" });
  assert.deepEqual(onlyZoho, { kind: "only", book: "Zoho" });
  assert.equal(booksWords(onlyMimi), "Only in Mimi's book");
  assert.equal(booksWords(onlyZoho), "Only in Zoho Books");
  assert.ok(!booksWords(onlyMimi).includes("0"), "a missing book is words, not a nought");
});

test("neither book sending a figure is silent, which is not a nought and not a blank", () => {
  const s = booksState(money());
  assert.deepEqual(s, { kind: "silent" });
  assert.equal(booksWords(s), "Neither book has a figure for this");
});

test("two figures that differ with no amount sent still say they differ", () => {
  const s = booksState(money({ mimi: "₦10", zoho: "₦4", mimiKobo: 1000, zohoKobo: 400 }));
  assert.deepEqual(s, { kind: "apart", book: "Mimi", amount: "" });
  assert.equal(booksWords(s), "Mimi is higher, and no amount came with it", "never left dangling after by");
  assert.equal(
    booksWords(booksState(money({ mimi: "₦4", zoho: "₦10", difference: "", mimiKobo: 400, zohoKobo: 1000 }))),
    "Zoho Books is higher, and no amount came with it",
  );
  /* the direction unreadable as well: both sides say the same thing, and the amount is absent */
  assert.equal(
    booksWords(booksState(money({ mimi: "₦4", zoho: "₦10" }))),
    "They differ, and no amount came with it",
  );
});

test("the book names the API refiles as Zoho Books keep the words the screen prints", () => {
  assert.equal(booksWords(booksState(money({ mimi: "₦10", zoho: "₦4", difference: "₦6", differenceKobo: 600 })), "Zoho Books"), "Mimi is higher by ₦6");
  assert.equal(booksWords(booksState(money({ mimi: "", zoho: "₦4" })), "Zoho Books"), "Only in Zoho Books");
});

const agreement = (shops: BooksShop[]): BooksAgreement => ({
  asOf: "2026-11-04T09:04:00+01:00",
  connected: true,
  shops,
  total: money({ mimi: "₦0", zoho: "₦0" }),
  note: "",
});

test("the shops worth a look come first, biggest Mimi figure at the top", () => {
  const v = agreement([
    shop("Agreed Mart", money({ mimi: "₦900,000", zoho: "₦900,000", differenceKobo: 0, mimiKobo: 90000000 })),
    shop("Small Gap", money({ mimi: "₦10,000", zoho: "₦9,000", difference: "₦1,000", differenceKobo: 100000, mimiKobo: 1000000 })),
    shop("Big Gap", money({ mimi: "₦3,497,300", zoho: "₦3,400,000", difference: "₦97,300", differenceKobo: 9730000, mimiKobo: 349730000 })),
  ]);
  assert.deepEqual(orderedShops(v).map((s) => s.name), ["Big Gap", "Small Gap", "Agreed Mart"]);
  assert.deepEqual(apartShops(v).map((s) => s.name), ["Big Gap", "Small Gap"]);
});

test("the summary line names the shops and counts them, and agreement is said plainly", () => {
  const v = agreement([
    shop("Mama Sola Provisions", money({ mimi: "₦3,497,300", zoho: "₦3,400,000", difference: "₦97,300", mimiKobo: 349730000, zohoKobo: 340000000 })),
    shop("Ikeja Stores", money({ mimi: "₦80,000", zoho: "₦70,000", difference: "₦10,000", mimiKobo: 8000000, zohoKobo: 7000000 })),
    shop("Yaba Mart", money({ mimi: "₦12,000", zoho: "₦11,000", difference: "₦1,000", mimiKobo: 1200000, zohoKobo: 1100000 })),
    shop("Surulere Depot", money({ mimi: "₦5,000", zoho: "₦5,000", differenceKobo: 0, mimiKobo: 500000, zohoKobo: 500000 })),
  ]);
  assert.equal(
    apartLine(v),
    "3 of 4 shops do not agree: Mama Sola Provisions, Ikeja Stores and Yaba Mart.",
  );
  assert.equal(apartLine(agreement([shop("Surulere Depot", money({ mimi: "₦5,000", zoho: "₦5,000" }))])), "The one shop in both books agrees");
  assert.equal(apartLine(agreement([])), "", "no shops is nothing to say, not agreement");
});

test("more differing shops than the line names are counted, not dropped", () => {
  const many = ["A", "B", "C", "D", "E"].map((n) => shop(n, money({ mimi: "₦9", zoho: "₦1", difference: "₦8" })));
  assert.equal(apartLine(agreement(many)), "5 of 5 shops do not agree: A, B and C, and 2 more.");
});

/* ---------- the two books when they cannot be compared as a whole ---------- */

/* the live payload of 4 Nov 2026: Zoho connected, every shop unanswered on the Zoho side, and a total
   that presents a difference as though both books had been compared */
const liveRow = (n: number) => ({
  id: `shop-${String(n).padStart(3, "0")}`,
  name: `Shop ${n}`,
  ...money({ mimi: "₦500,000", mimiKobo: 50000000 }),
});

const liveBooks = (shops: BooksShop[]): BooksAgreement => ({
  asOf: "2026-11-04T15:08:59+00:00",
  connected: true,
  shops,
  total: money({ mimi: "₦12,560,350", zoho: "₦0", difference: "₦12,560,350", mimiKobo: 1256035000, zohoKobo: 0, differenceKobo: 1256035000 }),
  note: "Mimi minus Zoho: positive means Mimi's book is higher than what Zoho Books reports.",
});

/** The sentence the screen prints, asserted to be the not-comparable state first. */
const partLine = (v: BooksAgreement): string => {
  const w = booksWhole(v);
  assert.equal(w.kind, "part");
  return w.kind === "part" ? w.line : "";
};

test("a shop Zoho has no figure for is not comparable, and the whole book says so", () => {
  const v = liveBooks(Array.from({ length: 24 }, (_, i) => liveRow(i + 1)));
  assert.equal(notInZoho(v).length, 24, "read from the payload, never guessed");
  assert.deepEqual(booksWhole(v), {
    kind: "part",
    missing: 24,
    elsewhere: 0,
    line: "24 shops are not in Zoho Books yet, so the two books cannot be compared as a whole.",
  });
});

test("one shop not in Zoho Books is said in the singular", () => {
  const v = liveBooks([liveRow(1), { id: "shop-002", name: "Shop 2", ...money({ mimi: "₦1,000", zoho: "₦1,000", difference: "₦0", differenceKobo: 0 }) }]);
  assert.equal(partLine(v), "1 shop is not in Zoho Books yet, so the two books cannot be compared as a whole.");
});

test("a Zoho customer Mimi does not have is counted on its own, and both directions together", () => {
  const zohoOnlyShop = (id: string) => ({ id, name: `Zoho ${id}`, ...money({ zoho: "₦540,000", zohoKobo: 54000000 }) });
  const theirs = liveBooks([zohoOnlyShop("zoho:4012"), zohoOnlyShop("zoho:4013")]);
  assert.equal(notInZoho(theirs).length, 0, "a shop with a Zoho figure is not the not-yet-matched case");
  assert.equal(zohoOnlyShops(theirs).length, 2);
  assert.equal(
    partLine(theirs),
    "2 payments in Zoho Books belong to customers Mimi does not have, so the two books cannot be compared as a whole.",
  );
  assert.equal(
    partLine(liveBooks([zohoOnlyShop("zoho:4012")])),
    "1 payment in Zoho Books belongs to a customer Mimi does not have, so the two books cannot be compared as a whole.",
  );
  const both = liveBooks([...Array.from({ length: 24 }, (_, i) => liveRow(i + 1)), zohoOnlyShop("zoho:4012"), zohoOnlyShop("zoho:4013")]);
  assert.equal(
    partLine(both),
    "24 shops are not in Zoho Books yet, and 2 payments in Zoho Books belong to customers Mimi does not have, so the two books cannot be compared as a whole.",
  );
});

test("the count is the rows with no Zoho figure and no difference: a figure on either side is a comparison", () => {
  const noDiff = { id: "shop-003", name: "Shop 3", ...money({ mimi: "₦10", zoho: "₦4", mimiKobo: 1000, zohoKobo: 400 }) };
  assert.equal(notInZoho(liveBooks([noDiff])).length, 0, "a Zoho figure with no difference amount is still a comparison");
  const odd = { id: "shop-004", name: "Shop 4", ...money({ mimi: "₦10", difference: "₦5" }) };
  assert.equal(notInZoho(liveBooks([odd])).length, 0, "a difference with no Zoho figure is not the not-yet-matched case");
  /* a row neither book has a figure for cannot be compared either, so it counts the same way */
  const silent = { id: "shop-005", name: "Shop 5", ...money() };
  assert.equal(notInZoho(liveBooks([silent])).length, 1);
});

test("when every row is comparable, the whole book renders as it always has, with no sentence", () => {
  const v = liveBooks([
    { id: "shop-001", name: "Mama Sola Provisions", ...money({ mimi: "₦3,497,300", zoho: "₦3,400,000", difference: "₦97,300", mimiKobo: 349730000, zohoKobo: 340000000, differenceKobo: 9730000 }) },
    { id: "shop-002", name: "Ikeja Stores", ...money({ mimi: "₦1,000,000", zoho: "₦1,000,000", difference: "₦0", mimiKobo: 100000000, zohoKobo: 100000000, differenceKobo: 0 }) },
  ]);
  assert.deepEqual(booksWhole(v), { kind: "whole" });
  assert.equal(notInZoho(v).length, 0);
  assert.equal(zohoOnlyShops(v).length, 0);
  /* the rendering the screen has always had, unchanged */
  assert.equal(apartLine(v), "1 of 2 shops do not agree: Mama Sola Provisions.");
  assert.equal(booksWords(booksState(shop("Mama Sola Provisions", v.shops[0]!))), "Mimi is higher by ₦97,300");
});
