/**
 * How a decided approval reads, in one place. The in-thread card and the decided row on Needs you
 * both word their outcome here, so the two surfaces cannot drift apart.
 *
 * The rule (owner, 5 Nov 2026): a surface claims a real ledger write only when the API says the
 * write was real. `result.demo` true means it happened in the demo's own copy and nothing reached
 * Zoho Books, so the card says that in plain words rather than "Recorded in Zoho". A real write says
 * where it landed, against the invoice, because that is then true.
 */
export type DecidedOutcome = "approved" | "declined" | "undone";

/** The sentence a write the API marked demo only ends in. The same words on the card and on the row. */
export const demoOnlyLine = "Demo only: no real record changed.";

/** What a card knows about its own ending, read from the API's answer. */
export type DecidedLook = {
  outcome: DecidedOutcome;
  /** The card's kind: `zoho` is the one that writes to Zoho Books. */
  kind: string;
  /** The card's own line once approved ("Recorded in Zoho", "Limit now ₦900,000"). */
  doneText: string;
  /** The card's own line once declined ("Not recorded", "Limit kept"). */
  declinedText?: string;
  /** The card's own line once taken back ("Taken back out of Zoho"). */
  undoText?: string;
  /** The API's `result.demo`: the write was demo only. */
  demoOnly?: boolean;
};

/** The one line saying how a decided approval ended. */
export function decidedLine(l: DecidedLook): string {
  /* Nothing was written, so there is nothing to caveat and nowhere to have put it. */
  if (l.outcome === "declined") return l.declinedText ?? "Declined";
  /* A demo-only write never reads as a real one, whatever its kind. */
  if (l.demoOnly) return demoOnlyLine;
  if (l.outcome === "undone") return l.undoText ?? "Taken back";
  /* A real Zoho write names the book it landed in and the invoice it went against. */
  return l.kind === "zoho" ? "Recorded in Zoho Books against the invoice" : l.doneText;
}

/** The outcome itself, in one word ("Approved"). */
export const outcomeWords = (o: DecidedOutcome): string =>
  o === "approved" ? "Approved" : o === "declined" ? "Declined" : "Undone";

/** How a card's status and undo state read as an outcome. One reading for both surfaces. */
export const outcomeOf = (c: { status: string; undo?: { state: string } }): DecidedOutcome =>
  c.status === "declined" ? "declined" : c.undo?.state === "done" ? "undone" : "approved";
