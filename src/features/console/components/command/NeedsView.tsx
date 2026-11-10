"use client";

import { useMemo, useState } from "react";
import { runItemAction } from "@/features/console/api/command-actions";
import { ItemCard } from "@/features/console/components/command/ItemCard";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import type { CommandActor, Item } from "@/features/console/content/command";
import { isOverdue, needsYou, type ItemAction } from "@/features/console/lib/command-rules";

/**
 * Needs you: the caller's own pile, overdue first, then the soonest due. An approval shows the same
 * permit as the card always has (approve, or not now), decided by the caller's role and the item's
 * state, so an agent or a rep is never offered a Close on a money item.
 */
export function NeedsView({ actor, items, now }: { actor: CommandActor; items: Item[]; now: number }) {
  const mine = useMemo(() => needsYou(actor, items, now), [actor, items, now]);
  const overdue = mine.filter((i) => isOverdue(i, now)).length;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const onAction = async (item: Item, action: ItemAction) => {
    setBusy(true);
    const out = await runItemAction(item, action);
    setBusy(false);
    setNote(out.note);
  };

  return (
    <section className="cmd-main" aria-label="Needs you">
      <header className="cmd-hd">
        <h1 className="cmd-hd__t">Needs you</h1>
        <p className="cmd-hd__s">
          {mine.length === 0
            ? "Nothing is waiting on you."
            : `${mine.length} item${mine.length === 1 ? "" : "s"} waiting on you${overdue > 0 ? `, ${overdue} overdue` : ""}.`}
        </p>
      </header>
      {mine.length === 0 ? (
        <EmptyState>Nothing is waiting on you</EmptyState>
      ) : (
        <div className="cmd-items">
          {mine.map((i) => (
            <ItemCard key={i.id} item={i} actor={actor} now={now} note={note} onAction={onAction} busy={busy} />
          ))}
        </div>
      )}
    </section>
  );
}
