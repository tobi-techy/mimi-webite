/**
 * The live demo tour drives the visitor's own copy of the book, so the API writes the same story
 * into the owner (Mimi) thread: the brief, "the bank confirmed…", the Zoho approval card, "Recorded…",
 * "Undone…". Mimi's chat already tells it as the tour, so those echoes are hidden (pure, no imports,
 * so it can be unit tested):
 *
 * - while the tour plays, every owner-thread message that was not there when it started (except what
 *   the owner typed, which ends the tour anyway);
 * - for as long as the tour stays in the chat, the API card of any approval the tour owns (its Zoho
 *   card), so one decision never shows as two cards.
 */
export type EchoMessage = { id: string; kind: string; from?: string };

export type TourEcho = {
  /** The tour is playing (or offering its next chip). */
  active: boolean;
  /** Owner-thread message ids when the tour started (null: none read yet, so nothing counts as old). */
  baseline: ReadonlySet<string> | null;
  /** Approval ids behind the tour's own cards. */
  approvals: ReadonlySet<string>;
};

export function hideTourEcho<M extends EchoMessage>(messages: readonly M[], echo: TourEcho): M[] {
  return messages.filter((m) => {
    if (m.kind === "card" && m.id.startsWith("apr:") && echo.approvals.has(m.id.slice(4))) return false;
    if (!echo.active) return true;
    if (m.kind === "date") return true;
    if (m.kind === "text" && m.from === "me") return true;
    return !!echo.baseline?.has(m.id);
  });
}
