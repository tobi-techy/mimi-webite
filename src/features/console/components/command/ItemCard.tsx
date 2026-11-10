"use client";

import { Button } from "@/features/console/components/ui/Button";
import { Pill } from "@/features/console/components/ui/Pill";
import type { CommandActor, Item } from "@/features/console/content/command";
import {
  availableItemActions,
  closedReasonWords,
  dueWords,
  itemKindWords,
  severityTone,
  severityWords,
  stateTone,
  stateWords,
  type ItemAction,
} from "@/features/console/lib/command-rules";

/**
 * One item, as a card: what it is, who owns it, how far along it is, when it is due, how urgent it
 * is, and only the actions the state and the caller's role permit. `availableItemActions` decides
 * which buttons exist, so an agent or a rep is never offered a Close on a money item, and no one is
 * offered one before it has been worked on.
 */
export function ItemCard({
  item,
  actor,
  now,
  note,
  onAction,
  busy,
}: {
  item: Item;
  actor: CommandActor;
  now: number;
  /** What the last attempt answered, in plain words. "" when there is nothing to say. */
  note?: string;
  onAction?: (item: Item, action: ItemAction) => void;
  busy?: boolean;
}) {
  const actions = availableItemActions(item, actor);
  const due = dueWords(item, now);
  const closed = item.state === "closed" || item.state === "dropped";
  return (
    <article className="cmd-item" aria-label={`${itemKindWords(item.kind)}: ${item.title}`}>
      <header className="cmd-item__hd">
        <span className="cmd-item__k">{itemKindWords(item.kind)}</span>
        <Pill tone={severityTone(item.severity)}>{severityWords(item.severity)}</Pill>
        <Pill tone={stateTone(item.state)}>{stateWords(item.state)}</Pill>
      </header>
      <h3 className="cmd-item__t">{item.title}</h3>
      {item.body && <p className="cmd-item__b">{item.body}</p>}
      <p className="cmd-item__m">
        <span>{item.ownerName || "No owner yet"}</span>
        {due && <span className={due.startsWith("Overdue") ? "cmd-item__m--late" : undefined}>{due}</span>}
        {closed && item.closedByName && (
          <span>
            Closed by {item.closedByName}
            {item.closedReason ? `, ${closedReasonWords(item.closedReason)}` : ""}
          </span>
        )}
      </p>
      {note && <p className="cmd-item__no">{note}</p>}
      {actions.length > 0 && (
        <div className="cmd-item__acts">
          {actions.map((a) => (
            <Button key={a.key} size="sm" variant={a.tone} disabled={busy} onClick={() => onAction?.(item, a)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
      {!closed && actions.length === 0 && <p className="cmd-item__ro">Nothing here for you to decide.</p>}
    </article>
  );
}
