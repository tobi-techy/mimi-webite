import type {
  Channel,
  ChannelKind,
  ClosedReason,
  CommandActor,
  Item,
  ItemState,
  Provenance,
  Severity,
} from "../content/command.ts";
import { channelKindIcon, channelKindOrder, channelKindWords, isMoneyKind } from "../content/command.ts";

/**
 * The rules of Command (docs/PHASE1-COMMAND.md sections 5 to 7), and the words for them. Everything
 * here is a pure function of records: no model decides who owns what, who may close what, or what a
 * state is called. That is why it lives away from the screens, so it can be tested on its own.
 *
 * The two rules that matter most, because getting them wrong moves money or loses an audit trail:
 * - An agent never closes a money item, and a rep never closes one either. A supervisor closes one
 *   only for their own reps, with a decision behind it; the owner may always.
 * - An item cannot be actioned without an owner. Code refuses it, not a screen.
 */

/* ---- words ---- */

export const stateWords = (s: ItemState): string =>
  s === "flagged"
    ? "Flagged"
    : s === "assigned"
      ? "Assigned"
      : s === "actioned"
        ? "Worked on"
        : s === "closed"
          ? "Closed"
          : "Not needed";

export const severityWords = (s: Severity): string =>
  s === "critical" ? "Critical" : s === "high" ? "High" : s === "normal" ? "Normal" : "Low";

/** A severity reads in the pill's own tones: critical and high are red, normal amber, low quiet. */
export const severityTone = (s: Severity): "red" | "amber" | "muted" => (s === "critical" || s === "high" ? "red" : s === "normal" ? "amber" : "muted");

/** What an item is, in one word, the way a distributor says it. */
export const itemKindWords = (k: Item["kind"]): string =>
  k === "approval"
    ? "Approval"
    : k === "finding"
      ? "Finding"
      : k === "return"
        ? "Return"
        : k === "dispute"
          ? "Dispute"
          : k === "credit_flag"
            ? "Credit flag"
            : k === "exception"
              ? "Exception"
              : "Task";

/** Why an item was closed, in words. */
export const closedReasonWords = (r: ClosedReason): string =>
  r === "done" ? "done" : r === "duplicate" ? "a duplicate" : r === "not_needed" ? "not needed" : "reassigned elsewhere";

export const stateTone = (s: ItemState): "green" | "amber" | "muted" =>
  s === "closed" ? "green" : s === "actioned" ? "amber" : s === "dropped" ? "muted" : "muted";

const naira = (kobo: number): string => `₦${(kobo / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * How a message says it was written. A deterministic message says so and counts the records it was
 * checked against. A model-written one names the model and shows what it cost. A model-written one
 * with no model or no cost is a bug in the API, so it reads as unexplained rather than being papered
 * over here.
 */
export function provenanceWords(p: Provenance): { label: string; detail: string } {
  if (p.deterministic) {
    const n = p.evidence.length;
    return { label: "Written by code", detail: n > 0 ? `${n} record${n === 1 ? "" : "s"} checked` : "no records needed" };
  }
  const model = p.model.trim();
  const cost = p.costKobo > 0 ? naira(p.costKobo) : "";
  if (!model || !cost) return { label: "Written by a model", detail: "not explained by the API" };
  return { label: model, detail: `${cost} spent` };
}

/* ---- state and time, from records ---- */

export const isOpenItem = (i: Item): boolean => i.state !== "closed" && i.state !== "dropped";

const dueMs = (i: Item): number => {
  const t = Date.parse(i.dueAt ?? "");
  return Number.isNaN(t) ? 0 : t;
};

export const isOverdue = (i: Item, now: number): boolean => {
  const t = dueMs(i);
  return isOpenItem(i) && t > 0 && t < now;
};

/** A span in the shortest words that stay true: minutes, then hours, then days. */
function span(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"}`;
}

/** When an item is due, in words relative to now. "" when it is closed or carries no due time. */
export function dueWords(i: Item, now: number): string {
  const t = dueMs(i);
  if (!isOpenItem(i) || t === 0) return "";
  return t < now ? `Overdue by ${span(now - t)}` : `Due in ${span(t - now)}`;
}

/* ---- who sees what (section 7) ---- */

/** A user who is an owner sees every channel; everyone else sees the ones they belong to. */
export function seesChannel(actor: CommandActor, channel: Channel): boolean {
  if (actor.kind === "user" && actor.role === "owner") return true;
  return actor.channelIds.includes(channel.id);
}

export function visibleChannels(actor: CommandActor, channels: readonly Channel[]): Channel[] {
  return channels.filter((c) => seesChannel(actor, c));
}

/**
 * A supervisor sees the items in their territories, which is their channels. A rep sees the items
 * assigned to them and nothing else, even inside a channel they belong to. An owner sees all.
 */
export function seesItem(actor: CommandActor, item: Item): boolean {
  if (actor.kind === "agent") return actor.channelIds.includes(item.channelId);
  if (actor.role === "owner") return true;
  if (actor.role === "supervisor") return actor.channelIds.includes(item.channelId);
  return item.ownerUserId === actor.id;
}

export function visibleItems(actor: CommandActor, items: readonly Item[]): Item[] {
  return items.filter((i) => seesItem(actor, i));
}

/** True when the actor is responsible for the item's channel or owns it: what every action checks. */
export function overItem(actor: CommandActor, item: Item): boolean {
  if (actor.kind === "agent") return actor.channelIds.includes(item.channelId);
  if (actor.role === "owner") return true;
  if (actor.role === "supervisor") return actor.channelIds.includes(item.channelId);
  return item.ownerUserId === actor.id;
}

/* ---- what may be done (sections 5 and 7) ---- */

export type ItemActionKey = "assign" | "action" | "close" | "drop" | "approve";
export type ItemAction = { key: ItemActionKey; label: string; tone: "primary" | "secondary" | "ghost" };

export const mayAssignItem = (actor: CommandActor, item: Item): boolean =>
  actor.kind === "user" && item.state === "flagged" && overItem(actor, item);

/** Actioned needs an owner. Code refuses the transition without one, so no screen offers it. */
export const mayActionItem = (actor: CommandActor, item: Item): boolean =>
  item.state === "assigned" && item.ownerUserId !== "" && overItem(actor, item);

/**
 * Closing. A money item is a user's decision: the owner may always, a supervisor only for their own
 * reps, a rep never and an agent never. Anything else may be closed by whoever is over it.
 */
export function mayCloseItem(actor: CommandActor, item: Item): boolean {
  if (item.state !== "actioned") return false;
  if (isMoneyKind(item.kind)) {
    if (actor.kind === "agent") return false;
    if (actor.role === "rep") return false;
    if (actor.role === "owner") return true;
    return actor.repIds.includes(item.ownerUserId);
  }
  return overItem(actor, item);
}

/** Dropping is closing by another name, so a money item needs the same hands. */
export function mayDropItem(actor: CommandActor, item: Item): boolean {
  if (!isOpenItem(item)) return false;
  if (!overItem(actor, item)) return false;
  if (!isMoneyKind(item.kind)) return true;
  if (actor.kind === "agent") return false;
  if (actor.role === "rep") return false;
  if (actor.role === "owner") return true;
  return actor.repIds.includes(item.ownerUserId);
}

/** A supervisor signs off a money item for one of their own reps, and only then. */
export const mayApproveMoneyItem = (actor: CommandActor, item: Item): boolean =>
  actor.kind === "user" && actor.role === "supervisor" && isMoneyKind(item.kind) && actor.repIds.includes(item.ownerUserId);

/**
 * The actions the state and the caller's role permit, in the order the card shows them. Empty means
 * the card is read-only for this caller, which is what an agent sees on a money item.
 */
export function availableItemActions(item: Item, actor: CommandActor): ItemAction[] {
  if (!isOpenItem(item) || !overItem(actor, item)) return [];
  const actions: ItemAction[] = [];
  if (mayAssignItem(actor, item)) actions.push({ key: "assign", label: "Assign", tone: "secondary" });
  /* a money item's next step is a decision, never a bare "done": its Close is the decision itself */
  if (mayActionItem(actor, item) && !isMoneyKind(item.kind)) actions.push({ key: "action", label: "Mark done", tone: "secondary" });
  /* a supervisor signing off an approval for their own rep: Approve is the close, so no second button */
  const approving = item.kind === "approval" && mayApproveMoneyItem(actor, item);
  if (approving) actions.push({ key: "approve", label: "Approve", tone: "primary" });
  if (mayCloseItem(actor, item) && !approving) actions.push({ key: "close", label: "Close", tone: "primary" });
  if (mayDropItem(actor, item) && !mayCloseItem(actor, item))
    actions.push({ key: "drop", label: isMoneyKind(item.kind) ? "Not now" : "Not needed", tone: "ghost" });
  return actions;
}

/* ---- what is waiting on the caller ---- */

/**
 * The caller's own pile. An item awaits a user when they own it, or when it is a money item awaiting
 * their sign-off for one of their reps. Overdue first, then the soonest due, then oldest raised.
 */
export function needsYou(actor: CommandActor, items: readonly Item[], now: number): Item[] {
  if (actor.kind === "agent") return [];
  const mine = visibleItems(actor, items).filter(
    (i) => isOpenItem(i) && (i.ownerUserId === actor.id || (actor.role === "supervisor" && i.kind === "approval" && actor.repIds.includes(i.ownerUserId))),
  );
  return mine.sort((a, b) => Number(!isOverdue(a, now)) - Number(!isOverdue(b, now)) || order(a) - order(b));
}

const order = (i: Item): number => dueMs(i) || Date.parse(i.createdAt ?? "") || 0;

/* ---- the rail ---- */

export type ChannelGroup = { kind: ChannelKind; label: string; icon: (typeof channelKindIcon)[ChannelKind]; channels: Channel[] };

/** The channels the caller may see, grouped the way the rail draws them, empty groups dropped. */
export function groupChannels(actor: CommandActor, channels: readonly Channel[]): ChannelGroup[] {
  const seen = visibleChannels(actor, channels);
  const groups: ChannelGroup[] = [];
  for (const kind of channelKindOrder) {
    const inKind = seen.filter((c) => c.kind === kind).sort((a, b) => a.name.localeCompare(b.name));
    if (inKind.length === 0) continue;
    groups.push({ kind, label: channelKindWords[kind], icon: channelKindIcon[kind], channels: inKind });
  }
  return groups;
}

/** The first channel the caller may see, so a screen has something to open. */
export const firstChannel = (actor: CommandActor, channels: readonly Channel[]): Channel | null => groupChannels(actor, channels)[0]?.channels[0] ?? null;

/* ---- the morning digest (section 2) ---- */

export type DigestInput = {
  actor: CommandActor;
  items: readonly Item[];
  /** The cutoff for "what closed since": usually yesterday's digest time. */
  sinceIso: string;
  now: number;
};

const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? "";

/**
 * The digest, built by code from records and never narrated by a model: what needs the caller, what
 * closed and who closed it, and what slipped and now escalates. Line for line, so the screen can
 * render the first line as a greeting and the rest as the day's brief.
 */
export function digestLines({ actor, items, sinceIso, now }: DigestInput): string[] {
  if (actor.kind === "agent") return [];
  const since = Date.parse(sinceIso ?? "") || 0;
  const mine = visibleItems(actor, items);
  const needs = needsYou(actor, items, now);
  const overdue = needs.filter((i) => isOverdue(i, now));
  const closed = mine.filter((i) => i.state === "closed" && (Date.parse(i.closedAt ?? "") || 0) >= since);
  const slipped = mine.filter((i) => isOverdue(i, now) && i.ownerUserId !== actor.id);

  const hi = firstName(actor.name);
  const lines: string[] = [];
  if (needs.length === 0) lines.push(`Good morning${hi ? `, ${hi}` : ""}. Nothing is waiting on you today.`);
  else
    lines.push(
      `Good morning${hi ? `, ${hi}` : ""}. ${needs.length} item${needs.length === 1 ? "" : "s"} ${needs.length === 1 ? "needs" : "need"} you today${overdue.length > 0 ? `, ${overdue.length} of them overdue` : ""}.`,
    );

  if (closed.length > 0) {
    const named = closed.slice(0, 3).map((i) => `${i.title}${i.closedByName ? ` (${i.closedByName})` : ""}`);
    const rest = closed.length - named.length;
    lines.push(`Closed since yesterday: ${named.join("; ")}${rest > 0 ? `; and ${rest} more` : ""}.`);
  }

  if (slipped.length > 0) {
    const named = slipped.slice(0, 3).map((i) => i.title);
    const rest = slipped.length - named.length;
    lines.push(`Slipped and escalating: ${named.join("; ")}${rest > 0 ? `; and ${rest} more` : ""}.`);
    if (actor.role === "supervisor" || actor.role === "owner") lines.push("These now sit with the owner of each channel.");
  }

  if (needs.length === 0 && closed.length === 0 && slipped.length === 0) lines.push("Nothing has come in yet.");
  return lines;
}
