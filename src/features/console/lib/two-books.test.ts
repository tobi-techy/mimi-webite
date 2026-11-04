/**
 * Two books, where each shop stands (Tobi, 4 Nov 2026). The screen never works out a figure: every
 * amount is the API's own string, and the kobo integers only say which side is higher. These tests
 * hold the four states, hold the direction to words rather than a signed number, and hold a book
 * that sent no figure to "no figure" rather than a nought, which would read as an empty book.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { apartLine, apartShops, booksState, booksWords, orderedShops } from "./two-books.ts";
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
