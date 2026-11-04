/**
 * Two books, the moment the API grows the read (owner-approved shape, 4 Nov 2026: the connectors
 * agent implements exactly this, so the console is not reading a shape it guessed at).
 *
 * One place to change. Until the route lands the console shows the honest "not available yet" note
 * on /books and never invents a row or a nought.
 *
 * `GET /v1/books/agreement` (owner key):
 * ```json
 * {
 *   "as_of": "2026-11-04T09:04:00+01:00",
 *   "zoho_connected": true,
 *   "shops": [
 *     {
 *       "shop_id": "shop-001",
 *       "shop_name": "Mama Sola Provisions",
 *       "mimi_outstanding_kobo": 349730000,
 *       "mimi_outstanding_naira": "₦3,497,300",
 *       "zoho_outstanding_kobo": 340000000,
 *       "zoho_outstanding_naira": "₦3,400,000",
 *       "difference_kobo": 9730000,
 *       "difference_naira": "₦97,300",
 *       "zoho_contact_id": "zc-shop-001"
 *     }
 *   ],
 *   "total": {
 *     "mimi_outstanding_kobo": 1256035000, "mimi_outstanding_naira": "₦12,560,350",
 *     "zoho_outstanding_kobo": 1246305000, "zoho_outstanding_naira": "₦12,463,050",
 *     "difference_kobo": 9730000, "difference_naira": "₦97,300"
 *   },
 *   "currency": "NGN"
 * }
 * ```
 * Money arrives twice: integer kobo for code and a formatted naira string for display. The console
 * renders the string and never a figure it built itself, not even a difference; kobo is used only
 * for the sort and for which book is higher. A missing string is shown as missing (the row says so),
 * never formatted from kobo.
 *
 * `zoho_connected: false` gates the whole screen: Zoho Books is not connected, so there is nothing
 * to compare and no figure is shown at all. Only an explicit `false` says that: absent is not the
 * same as false, and the console makes no claim it was not given. A shop only one book knows carries
 * `null` (and a "") on the other side and is its own state on the screen.
 *
 * **A shop Zoho Books has no figure for is not a nought and not agreement, and it is not a whole-book
 * comparison either** (Tobi, 4 Nov 2026). While matching is unfinished the live payload answers
 * `zoho_connected: true` with every shop row carrying `zoho_outstanding_naira: ""` and
 * `difference_naira: ""`, and a total of `zoho_outstanding_naira: "₦0"` with a full
 * `difference_naira`. The console counts those rows and, while there are any, shows Mimi's own total
 * and a plain sentence where the Zoho total and the difference would be: "24 shops are not in Zoho
 * Books yet, so the two books cannot be compared as a whole." Nothing is worked out here, and no
 * figure is invented. The other direction is the `zoho:<id>` prefix on `shop_id`, a Zoho customer
 * Mimi's book does not have ("2 payments in Zoho Books belong to customers Mimi does not have"); keep
 * that prefix, because it is what tells the two apart. When every row carries both figures the totals
 * are shown exactly as above.
 *
 * An answer this console does not recognise reads as "not available yet", never as an empty book and
 * never as two books that agree: renamed fields, or a shops list where no row could be read, is a
 * shape we do not know. `{"shops": []}` is an honest empty comparison, and a total with a figure is a
 * comparison even with no shops in it.
 */
export const BOOKS_PATH = "/v1/books/agreement";
