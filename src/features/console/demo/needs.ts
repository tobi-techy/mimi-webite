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
        primary: m.card.primary,
        status: m.card.status,
        conv,
      });
    }
  }
  return out;
}

export const needCount = (conversations: Conversation[]) =>
  conversations.reduce((n, c) => n + c.messages.filter((m) => m.kind === "card" && m.card.status === "needs").length, 0);
