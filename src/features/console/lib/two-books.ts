import type { BooksAgreement, BooksMoney, BooksShop } from "@/features/console/content/books";

/**
 * Where the two books stand with each other (Tobi, 4 Nov 2026). The console never works out a
 * figure: every amount below is the API's own formatted string, and the kobo integers only decide
 * which side is higher. A book that has no figure is its own state, never a nought and never blank.
 */
export type BooksState =
  | { kind: "agreed" }
  /** They differ. `book` is which side is higher, or null when only the amount is known. */
  | { kind: "apart"; book: "Mimi" | "Zoho" | null; amount: string }
  /** One book knows this shop and the other does not. */
  | { kind: "only"; book: "Mimi" | "Zoho" }
  /** Neither book sent a figure for it. */
  | { kind: "silent" };

const has = (s: string | null | undefined): boolean => (s ?? "").trim() !== "";

/** Which side is higher, from the API's own kobo figures. Null when that cannot be told. */
function side(m: BooksMoney): "Mimi" | "Zoho" | null {
  if (m.differenceKobo !== null) return m.differenceKobo === 0 ? null : m.differenceKobo > 0 ? "Mimi" : "Zoho";
  if (m.mimiKobo === null || m.zohoKobo === null) return null;
  return m.mimiKobo === m.zohoKobo ? null : m.mimiKobo > m.zohoKobo ? "Mimi" : "Zoho";
}

/** One row's state, from the two figures the API sent. */
export function booksState(m: BooksMoney): BooksState {
  const mimi = has(m.mimi);
  const zoho = has(m.zoho);
  if (!mimi && !zoho) return { kind: "silent" };
  if (mimi && !zoho) return { kind: "only", book: "Mimi" };
  if (zoho && !mimi) return { kind: "only", book: "Zoho" };
  if (has(m.difference)) {
    const who = side(m);
    /* a difference of nought is agreement even when the sign is unreadable */
    if (who === null && m.differenceKobo === 0) return { kind: "agreed" };
    return { kind: "apart", book: who, amount: m.difference };
  }
  /* both figures are there but no difference string: the machine figures decide, and nothing is worked out */
  if (m.mimiKobo !== null && m.zohoKobo !== null)
    return m.mimiKobo === m.zohoKobo ? { kind: "agreed" } : { kind: "apart", book: side(m), amount: "" };
  /* no figures to compare: the two strings themselves are the only evidence, so that is what is read */
  return m.mimi.trim() === m.zoho.trim() ? { kind: "agreed" } : { kind: "apart", book: null, amount: "" };
}

/**
 * One row's sentence, in words a distributor reads: which book is higher, and by how much. Never a
 * signed number in a column, because that makes the reader work out the sign.
 */
export function booksWords(s: BooksState, book = "Zoho Books"): string {
  if (s.kind === "agreed") return "Agreed";
  if (s.kind === "silent") return "Neither book has a figure for this";
  if (s.kind === "only") return s.book === "Mimi" ? "Only in Mimi's book" : `Only in ${book}`;
  const higher = s.book === "Mimi" ? "Mimi" : book;
  /* an amount the API did not send is never left dangling after "by", and never worked out here */
  if (!s.amount) return s.book === null ? "They differ, and no amount came with it" : `${higher} is higher, and no amount came with it`;
  return s.book === null ? `They differ by ${s.amount}` : `${higher} is higher by ${s.amount}`;
}

/** The shops worth looking at first: the ones that do not agree, biggest first (the summary's order). */
export function apartShops(v: BooksAgreement): BooksShop[] {
  return orderedShops(v).filter((s) => booksState(s).kind !== "agreed");
}

/** The rows in the order the screen shows them: anything that does not agree first, then by size. */
export function orderedShops(v: BooksAgreement): BooksShop[] {
  return [...v.shops].sort((a, b) => {
    const apart = Number(booksState(a).kind === "agreed") - Number(booksState(b).kind === "agreed");
    return apart || (b.mimiKobo ?? 0) - (a.mimiKobo ?? 0) || a.name.localeCompare(b.name);
  });
}

/** "3 of 40 shops do not agree: Mama Sola Provisions, Ikeja Stores and Yaba Mart." Naming them is the point. */
export function apartLine(v: BooksAgreement, max = 3): string {
  const apart = apartShops(v);
  if (apart.length === 0)
    return v.shops.length === 0 ? "" : v.shops.length === 1 ? "The one shop in both books agrees" : `All ${v.shops.length} shops agree`;
  const names = apart.slice(0, max).map((s) => s.name);
  const rest = apart.length - names.length;
  const list = names.length === 1 ? names[0]! : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  /* a list already joined by "and" takes the rest after a comma, so the line never says "and … and" */
  const more = rest > 0 ? (names.length === 1 ? ` and ${rest} more` : `, and ${rest} more`) : "";
  return `${apart.length} of ${v.shops.length} shops do not agree: ${list}${more}.`;
}
