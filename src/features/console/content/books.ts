/**
 * Two books, as the console shows them: Mimi's outstanding against the figure Zoho Books reports,
 * per shop and as a total (GET /v1/books/agreement).
 *
 * Money is only ever the string the API sent. The kobo integers are here for two things only: the
 * sort, and telling which book is higher. The console never builds a figure of its own, not even a
 * difference, so a missing string is shown as missing rather than formatted from kobo.
 */
export type BooksMoney = {
  /** Mimi's own outstanding, formatted by the API. "" when this book has no figure. */
  mimi: string;
  /** Zoho Books' outstanding, formatted by the API. "" when Zoho does not know this shop. */
  zoho: string;
  /** The difference between them, formatted by the API. "" when there is no figure for it. */
  difference: string;
  /** Machine figures, for the sort and the direction. Never rendered. */
  mimiKobo: number | null;
  zohoKobo: number | null;
  differenceKobo: number | null;
};

export type BooksShop = BooksMoney & { id: string; name: string };

/** The whole book: the same two figures, with no shop name. */
export type BooksTotal = BooksMoney;

export type BooksAgreement = {
  /** When the API read both books, ISO with zone. "" when it sent none. */
  asOf: string;
  /** False when Zoho Books is not connected: the screen says so and shows no figure at all. */
  connected: boolean;
  shops: BooksShop[];
  total: BooksTotal;
  /** The API's own note about the comparison, when it sends one. */
  note: string;
};
