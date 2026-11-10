import type {
  ApiChannel,
  ApiChannelMessage,
  ApiCommandBundle,
  ApiItem,
  ApiProvenance,
} from "../api/command-contract.ts";
import type {
  Channel,
  ChannelKind,
  ChannelMessage,
  ClosedReason,
  CommandActor,
  CommandDigest,
  AuthorKind,
  Item,
  ItemKind,
  ItemState,
  Provenance,
  Role,
  Severity,
} from "../content/command.ts";

/**
 * The API payloads turned into what the console reads (api/command-contract.ts -> content/command.ts).
 * Pure and conservative: a value this console does not know is dropped, never guessed, and a machine
 * id never reaches a screen. Both the mock preview and the real routes go through here, so a payload
 * that will not map fails the same way either way.
 */

export type CommandData = {
  actor: CommandActor;
  /** When the API read this, ISO with zone. "" when it sent none. */
  asOf: string;
  channels: Channel[];
  items: Item[];
  messages: ChannelMessage[];
  digest: CommandDigest | null;
};

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const kinds: readonly ItemKind[] = ["approval", "finding", "return", "dispute", "credit_flag", "exception", "task"];
const states: readonly ItemState[] = ["flagged", "assigned", "actioned", "closed", "dropped"];
const severities: readonly Severity[] = ["low", "normal", "high", "critical"];
const closedReasons: readonly ClosedReason[] = ["done", "duplicate", "not_needed", "reassigned_elsewhere"];
const channelKinds: readonly ChannelKind[] = ["territory", "credit", "collections", "returns", "stock", "general", "dm"];
const authorKinds: readonly AuthorKind[] = ["user", "agent", "helper", "system", "shop"];

const one = <T extends string>(list: readonly T[], v: unknown, fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);

/** The neutral word a ref falls back to, per author, so an unknown ref never prints as an id. */
const FALLBACK: Record<AuthorKind, string> = {
  user: "Someone",
  agent: "Mimi",
  helper: "A helper",
  system: "Automatic",
  shop: "A shop",
};

function nameOf(names: Record<string, string>, ref: string, kind: AuthorKind): string {
  const named = str(names[ref]).trim();
  return named || FALLBACK[kind];
}

export function mapChannel(a: ApiChannel): Channel {
  return {
    id: str(a.channel_id),
    kind: one(channelKinds, a.kind, "general"),
    slug: str(a.slug),
    name: str(a.name),
    topic: str(a.topic),
    unread: Math.max(0, num(a.unread)),
    openItems: Math.max(0, num(a.open_items)),
    defaultOwnerUserId: str(a.default_owner_user_id),
  };
}

function mapProvenance(p: ApiProvenance | undefined): Provenance {
  return {
    deterministic: p?.deterministic === true,
    model: str(p?.model),
    tool: str(p?.tool),
    evidence: Array.isArray(p?.evidence) ? p.evidence.filter((e) => typeof e === "string") : [],
    costKobo: Math.max(0, num(p?.cost_kobo)),
  };
}

export function mapItem(a: ApiItem, names: Record<string, string>): Item {
  const ownerUserId = str(a.owner_user_id);
  const closedByUserId = str(a.closed_by_user_id);
  const closedReason = one(closedReasons, a.closed_reason, "done");
  const s = a.subject ?? {};
  return {
    id: str(a.item_id),
    channelId: str(a.channel_id),
    kind: one(kinds, a.kind, "task"),
    state: one(states, a.state, "flagged"),
    severity: one(severities, a.severity, "normal"),
    title: str(a.title),
    body: str(a.body),
    subject: {
      shopId: str(s.shop_id),
      relationshipId: str(s.relationship_id),
      approvalId: str(s.approval_id),
      routineId: str(s.routine_id),
      deliveryId: str(s.delivery_id),
    },
    ownerUserId,
    ownerName: ownerUserId ? nameOf(names, ownerUserId, "user") : "",
    createdByKind: str(a.created_by_kind),
    createdByRef: str(a.created_by_ref),
    source: str(a.source),
    dueAt: str(a.due_at),
    slaMinutes: Math.max(0, num(a.sla_minutes)),
    createdAt: str(a.created_at),
    updatedAt: str(a.updated_at),
    closedAt: str(a.closed_at),
    closedByUserId,
    closedByName: closedByUserId ? nameOf(names, closedByUserId, "user") : "",
    closedReason: str(a.closed_reason) === "" ? "" : closedReason,
  };
}

export function mapMessage(a: ApiChannelMessage, items: Map<string, Item>, names: Record<string, string>): ChannelMessage {
  const authorKind = one(authorKinds, a.author_kind, "user");
  const itemId = str(a.item_id);
  const sourceThreadId = str(a.source_thread_id);
  return {
    id: str(a.message_id),
    channelId: str(a.channel_id),
    authorKind,
    authorRef: str(a.author_ref),
    authorName: nameOf(names, str(a.author_ref), authorKind),
    text: str(a.text),
    itemId,
    replyTo: str(a.reply_to),
    sourceThreadId,
    item: itemId ? items.get(itemId) : undefined,
    mirrored: authorKind === "shop" || sourceThreadId !== "",
    provenance: mapProvenance(a.provenance),
    createdAt: str(a.created_at),
  };
}

export function mapUserRole(role: string): Role {
  /* brand_viewer is deferred and no such user exists in the pilot; if one appears, it reads with
   * the least privilege rather than the most. */
  return role === "owner" ? "owner" : role === "supervisor" ? "supervisor" : "rep";
}

function actorOf(bundle: ApiCommandBundle): CommandActor {
  const me = bundle.me.user;
  return {
    kind: "user",
    id: str(me.user_id),
    name: str(me.name),
    role: mapUserRole(str(me.role)),
    /* membership comes from /v1/me, which lists only the channels this caller is in */
    channelIds: (bundle.me?.channels ?? bundle.channels).map((c) => str(c.channel_id)),
    repIds: bundle.users.filter((u) => u.role === "rep" && u.status !== "disabled").map((u) => str(u.user_id)),
  };
}

/**
 * One bundle into the shape the screens read. The tenant's channels come from `/v1/channels`; the
 * caller's counts and membership come from `/v1/me`, so a channel the caller is not in is simply not
 * visible rather than being dropped from the record. `asOf` is the items read's stamp.
 */
export function assembleCommand(bundle: ApiCommandBundle): CommandData {
  const names = bundle.names ?? {};
  const items = (bundle.items ?? []).map((i) => mapItem(i, names));
  const byId = new Map(items.map((i) => [i.id, i] as const));
  const mine = new Map((bundle.me?.channels ?? []).map((c) => [str(c.channel_id), c] as const));
  const all = bundle.channels?.length ? bundle.channels : (bundle.me?.channels ?? []);
  const asOf = str(bundle.as_of).trim();
  return {
    actor: actorOf(bundle),
    asOf,
    channels: all.map((c) => {
      const row = mapChannel(c);
      const own = mine.get(row.id);
      return own ? { ...row, unread: Math.max(0, num(own.unread)), openItems: Math.max(0, num(own.open_items)) } : row;
    }),
    items,
    messages: (bundle.messages ?? []).map((m) => mapMessage(m, byId, names)),
    digest: bundle.digest
      ? {
          forUserId: str(bundle.digest.for_user_id),
          generatedAt: str(bundle.digest.generated_at),
          lines: Array.isArray(bundle.digest.lines) ? bundle.digest.lines.filter((l) => typeof l === "string") : [],
        }
      : null,
  };
}
