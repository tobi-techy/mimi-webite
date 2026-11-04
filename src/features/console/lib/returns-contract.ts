/**
 * The returns ledger, the moment the API grows one.
 *
 * One place to change. Until the endpoint lands the console shows the honest "not available yet"
 * note on /returns and never invents a row, so this file holds the single constant the wired client
 * call will use and nothing that would pretend to be data.
 *
 * When the API agent publishes the contract, fill in here (and nowhere else):
 *   1. the response shape: the open returns, each return's lifecycle status, its lines with the
 *      product, quantity and reason, what actually came back, and the disposition;
 *   2. the exact status strings the API emits;
 *   3. the approval `kind` and payload keys for the draft credit, so `cardKindOf` in
 *      `features/console/api/mappers.ts` maps it to a card with Approve and Undo, the same shape as
 *      the Zoho record card.
 */
export const RETURNS_PATH = "/v1/returns";
