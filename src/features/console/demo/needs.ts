import type { CardStatus, Conversation, DecisionCard, HelperName } from "@/features/console/demo/types";

/** One item in the Needs you pile: a card somewhere in a thread that waits on the owner. */
export type NeedItem = {
  key: string;
  slug: string;
  messageId: string;
  helper: HelperName | "Mimi";
  kind: DecisionCard["kind"];
  what: string;
  shop?: string;
  amount?: number;
  why?: string;
  primary: string;
  status: CardStatus;
  conv: Conversation;
};

/** Cards that are drafts going out (restock to a supplier, brand email): the button says Send. */
const DRAFTS: DecisionCard["kind"][] = ["stock", "brand"];

/** The two buttons on an inline card: Approve (or Send for drafts) and Discard (Review opens the plan sheet). */
export function cardActions(c: DecisionCard): { primary: string; secondary: "Review" | "Discard" } {
  return { primary: DRAFTS.includes(c.kind) ? "Send" : "Approve", secondary: c.secondary === "Review" ? "Review" : "Discard" };
}

export const tierOf = (c: DecisionCard) => c.tier ?? "Approve";

const amountOf = (c: DecisionCard) =>
  c.amount ?? (c.rows.some((r) => r.amount !== undefined) ? c.rows.filter((r) => r.tone !== "Skip").reduce((s, r) => s + (r.amount ?? 0), 0) : undefined);

/** Every card across the helpers that still needs the owner (and ones mid-approval, so they settle in place). */
export function needItems(conversations: Conversation[]): NeedItem[] {
  const out: NeedItem[] = [];
  for (const conv of conversations) {
    for (const m of conv.messages) {
      if (m.kind !== "card" || (m.card.status !== "needs" && m.card.status !== "sending")) continue;
      const from = m.from === "me" ? conv.helper : m.from;
      out.push({
        key: `${conv.slug}:${m.id}`,
        slug: conv.slug,
        messageId: m.id,
        helper: from,
        kind: m.card.kind,
        what: m.card.title.split(" · ")[0] ?? m.card.title,
        shop: m.card.shop,
        amount: amountOf(m.card),
        why: m.card.why,
        primary: cardActions(m.card).primary,
        status: m.card.status,
        conv,
      });
    }
  }
  return out;
}

export const needCount = (conversations: Conversation[]) =>
  conversations.reduce((n, c) => n + c.messages.filter((m) => m.kind === "card" && m.card.status === "needs").length, 0);

/** How a decided card ended: approved, declined, or an approval the owner took back. */
export type DecidedOutcome = "approved" | "declined" | "undone";

/** One decided card as the needs screen's history row: what it was, how it ended, and when. */
export type DecidedItem = {
  key: string;
  slug: string;
  messageId: string;
  helper: HelperName | "Mimi";
  kind: DecisionCard["kind"];
  what: string;
  shop?: string;
  amount?: number;
  outcome: DecidedOutcome;
  /** One line saying how it ended, in the console's own words (or the demo caveat in their place). */
  line: string;
  /** When the owner decided, epoch ms. 0 when the API sent no time. */
  decidedAt: number;
  conv: Conversation;
};

/** The outcome in one word: the three states a card can be left in. */
export const outcomeWords = (o: DecidedOutcome): string => (o === "approved" ? "Approved" : o === "declined" ? "Declined" : "Undone");

/**
 * The API said the write was demo only (`result.demo`): the row says this instead of the card's own
 * done line, which would read as a change to a real book (the rehearsal's approved shop payment came
 * back `{"demo": true, "zoho_payment_id": "zfake_…"}`, and nothing reached Zoho Books).
 */
export const demoOnlyLine = "Demo only: no real record changed.";

/**
 * Decided cards (approved, declined, taken back), newest first. This is the history under the pile:
 * a decision the API still holds is never left invisible, since the header would then read as if
 * nothing had happened. A card still waiting on the owner belongs in the pile above, not here.
 */
export function decidedItems(conversations: Conversation[]): DecidedItem[] {
  const out: DecidedItem[] = [];
  for (const conv of conversations) {
    for (const m of conv.messages) {
      if (m.kind !== "card" || m.card.status === "needs" || m.card.status === "sending") continue;
      const c = m.card;
      const outcome: DecidedOutcome = c.undo?.state === "done" ? "undone" : c.status === "declined" ? "declined" : "approved";
      out.push({
        key: `${conv.slug}:${m.id}`,
        slug: conv.slug,
        messageId: m.id,
        helper: m.from === "me" ? conv.helper : m.from,
        kind: c.kind,
        what: c.title.split(" · ")[0] ?? c.title,
        shop: c.shop,
        amount: amountOf(c),
        outcome,
        line: c.demoOnly ? demoOnlyLine : outcome === "undone" ? c.undo?.text ?? "Taken back" : outcome === "declined" ? c.declinedText ?? "Declined" : c.doneText,
        decidedAt: c.decidedAt ?? 0,
        conv,
      });
    }
  }
  /* newest first; a card with no readable decision time (0) sits at the end */
  return out.sort((a, b) => b.decidedAt - a.decidedAt);
}

/**
 * The needs screen's one line, in words that are true in each of its three states: things waiting on
 * the owner; nothing waiting but decisions on the record; and nothing at all. "All clear" is said
 * only in the last one: with a decision the API still holds, it would be a false statement about a
 * record that exists (found in a live rehearsal, 5 Nov 2026).
 */
export function needsHeadline(p: { when: string; owner?: string; waiting: number; decided: number; busy?: readonly string[] }): string {
  const who = p.owner ? `, ${p.owner}` : "";
  const working = p.busy?.length ? ` ${p.busy.join(" and ")} ${p.busy.length > 1 ? "are" : "is"} working.` : "";
  if (p.waiting > 0) return `${p.when}${who}. ${p.waiting} thing${p.waiting === 1 ? "" : "s"} need${p.waiting === 1 ? "s" : ""} you.`;
  if (p.decided > 0) return `${p.when}${who}. Nothing waiting for you. ${p.decided} decision${p.decided === 1 ? "" : "s"} made.${working}`;
  return `All clear${who}.${working}`;
}
