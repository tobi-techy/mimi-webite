import type { IconName } from "@/features/console/components/ui/icon-paths";

/**
 * Command, as the console reads it (docs/PHASE1-COMMAND.md, 10 Nov 2026). This file is the shape of
 * a channel, its messages, its items and the people in them. It holds no logic that decides who may
 * do what: that is lib/command-rules.ts, so the rules can be tested on their own.
 *
 * The contract, held here in words so the screens cannot drift from it:
 * - A channel mirrors how the business runs, not the org chart. Its `kind` is one of six, and the
 *   rail groups by it.
 * - A message's `provenance` says how it was written. A model-written one carries the model and the
 *   cost; a deterministic one says so. A model-written message without both is a bug, not a row.
 * - An item always carries an owner, a due time and a state only code moves. Closing needs a reason
 *   from a fixed list.
 * - Shops are never members of an internal channel. Their words arrive as a mirror that names the
 *   shop, and the shop never becomes a participant.
 *
 * Machine ids (`ch_...`, `cm_...`, `it_...`, `u_...`) live in these types only so a render can key a
 * row and a wire can name a record. No id is ever shown to a person.
 */

export const channelKinds = ["territory", "credit", "collections", "returns", "stock", "general", "dm"] as const;
export type ChannelKind = (typeof channelKinds)[number];

/** The rail's group order. Territory first (the shape of the distributor), dm last. */
export const channelKindOrder: readonly ChannelKind[] = ["territory", "credit", "collections", "returns", "stock", "general", "dm"];

/** What a group is called on the rail. */
export const channelKindWords: Record<ChannelKind, string> = {
  territory: "Territories",
  credit: "Credit watch",
  collections: "Collections",
  returns: "Returns",
  stock: "Stock",
  general: "General",
  dm: "Direct messages",
};

/** The icon on a group's heading. */
export const channelKindIcon: Record<ChannelKind, IconName> = {
  territory: "map-pin",
  credit: "credit-card",
  collections: "landmark",
  returns: "package",
  stock: "triangle-alert",
  general: "message-square",
  dm: "messages-square",
};

export type Channel = {
  /** Machine id (`ch_...`). Never shown. */
  id: string;
  kind: ChannelKind;
  /** The rail's token in the address, and what a link names. Never shown. */
  slug: string;
  /** In words, written by code: "Credit watch". */
  name: string;
  /** One line on what the channel is for. "" when the API sent none. */
  topic: string;
  /** Messages the caller has not read. 0 is "nothing new", not "unknown". */
  unread: number;
  /** Items still open in this channel (not closed, not dropped). */
  openItems: number;
  /** The user a new item lands on when no one is named. Machine id, "" when the API sent none. */
  defaultOwnerUserId: string;
};

/* ---- messages ---- */

export const authorKinds = ["user", "agent", "helper", "system", "shop"] as const;
export type AuthorKind = (typeof authorKinds)[number];

/**
 * How a message was written. A model-written message carries the model and the cost in kobo; a
 * deterministic one says so in words. `evidence` names the records a checked message used.
 */
export type Provenance = {
  deterministic: boolean;
  /** The model's own name, "" when no model wrote it. */
  model: string;
  /** The tool an agent used, "" when none. */
  tool: string;
  /** Record refs the message was checked against. Never rendered as an id. */
  evidence: readonly string[];
  /** What the model cost, in kobo. 0 when nothing was spent. */
  costKobo: number;
};

export type ChannelMessage = {
  /** Machine id (`cm_...`). Never shown. */
  id: string;
  channelId: string;
  authorKind: AuthorKind;
  /** Machine ref: a user id, `mimi`, a helper id, or a shop ref. Never shown. */
  authorRef: string;
  /** The author in words, resolved from the people this console knows: "Mimi", "Tola A.". */
  authorName: string;
  text: string;
  /** The item this message carries, "" when it carries none. */
  itemId: string;
  /** The message this one answers, "" when it answers none. */
  replyTo: string;
  /** Set when a shop's message is mirrored: the shop conversation it came from. Never shown. */
  sourceThreadId: string;
  /** The item card rendered under this message, when there is one. */
  item?: Item;
  /** The shop's own words, mirrored. Only a `shop` author ever has this. */
  mirrored?: boolean;
  provenance: Provenance;
  /** ISO with zone: when the API stamped it. */
  createdAt: string;
};

/* ---- items ---- */

export const itemKinds = ["approval", "finding", "return", "dispute", "credit_flag", "exception", "task"] as const;
export type ItemKind = (typeof itemKinds)[number];

export const itemStates = ["flagged", "assigned", "actioned", "closed", "dropped"] as const;
export type ItemState = (typeof itemStates)[number];

export const itemSeverities = ["low", "normal", "high", "critical"] as const;
export type Severity = (typeof itemSeverities)[number];

/** The only reasons a close is allowed to carry (docs/PHASE1-COMMAND.md section 5). */
export const closedReasons = ["done", "duplicate", "not_needed", "reassigned_elsewhere"] as const;
export type ClosedReason = (typeof closedReasons)[number];

/** The subject an item is about. Every field is a machine id and none is ever shown. */
export type ItemSubject = {
  shopId: string;
  relationshipId: string;
  approvalId: string;
  routineId: string;
  deliveryId: string;
};

/** The kinds that carry money. These cannot be closed by an agent, or by a rep at all. */
export const moneyItemKinds: readonly ItemKind[] = ["approval", "credit_flag"];
export const isMoneyKind = (kind: ItemKind): boolean => moneyItemKinds.includes(kind);

export type Item = {
  /** Machine id (`it_...`). Never shown. */
  id: string;
  channelId: string;
  kind: ItemKind;
  state: ItemState;
  severity: Severity;
  /** One line, written by code or by a record: "Ikeja Stores is over its credit limit". */
  title: string;
  /** The detail, "" when there is none. */
  body: string;
  subject: ItemSubject;
  /** The user who owns it. "" is unassigned, which the card says in words. */
  ownerUserId: string;
  /** The owner in words, "" when unassigned. */
  ownerName: string;
  /** Who raised it: `user`, `agent`, `helper`, `system`. */
  createdByKind: string;
  /** Machine ref of who raised it. Never shown. */
  createdByRef: string;
  /** Where it came from: `routine:morning_brief`, `approval:apr_x`. Never shown. */
  source: string;
  /** ISO with zone, "" when no due time was set. */
  dueAt: string;
  /** The service target in minutes. 0 when none. */
  slaMinutes: number;
  createdAt: string;
  updatedAt: string;
  /** ISO with zone, "" while open. */
  closedAt: string;
  closedByUserId: string;
  /** Who closed it, in words. "" while open, or when the API named no one this console knows. */
  closedByName: string;
  /** "" while open, else one of closedReasons. */
  closedReason: ClosedReason | "";
};

/* ---- actors ---- */

export const userRoles = ["owner", "supervisor", "rep"] as const;
export type Role = (typeof userRoles)[number];

/**
 * Who is looking at the console. A user carries the channels they belong to (which encode their
 * territories) and, for a supervisor, the reps whose items they may decide; territory is not a
 * separate field, because membership is what the API sends.
 *
 * An agent (`mimi`, a helper) is a participant with a narrower budget: it may post, raise items and
 * action with evidence, and it may never close a money item.
 */
export type CommandActor =
  | {
      kind: "user";
      id: string;
      name: string;
      role: Role;
      /** Channels this user is a member of. Empty for an owner, who sees all of them. */
      channelIds: readonly string[];
      /** The reps whose items this supervisor may decide (their own reps). */
      repIds: readonly string[];
    }
  | { kind: "agent"; id: string; name: string; channelIds: readonly string[] };

/* ---- the digest ---- */

export type CommandDigest = {
  forUserId: string;
  /** ISO with zone: when the API built it. */
  generatedAt: string;
  /**
   * The digest, line by line, written by code from records (never narrated by a model). The screen
   * renders these as the day's first message.
   */
  lines: readonly string[];
};
