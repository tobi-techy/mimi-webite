/**
 * The Command payloads, exactly as the API contract documents them (docs/PHASE1-COMMAND.md section
 * 8). This file is the written contract the console builds against, and the shape every mock must
 * match. Nothing here is a content type the screens read: the mapper in lib/command-map.ts turns
 * these into the console's own types.
 *
 * What the API will send when the backend slices land:
 *   GET  /v1/me                 -> ApiMe (the caller, their role, their channels with counts)
 *   GET  /v1/channels           -> ApiChannelList
 *   GET  /v1/channels/{id}/messages?before=&limit= -> ApiChannelMessages
 *   GET  /v1/items?state=&owner=&channel=&kind=&due_before= -> ApiItemList
 *   GET  /v1/needs-you          -> ApiItemList
 *   GET  /v1/digest/today       -> ApiDigest
 *   POST /v1/items/{id}/assign | transition | comment -> ApiItem
 *
 * Until those routes exist the console reads a typed mock in content/command-mock.ts through the
 * same mapper, so swapping to the real endpoints is a change of source, not of screens.
 */

export type ApiUser = {
  user_id: string;
  name: string;
  role: "owner" | "supervisor" | "rep" | "brand_viewer";
  status: "invited" | "active" | "disabled";
};

/** One channel as `/v1/me` and `/v1/channels` send it, with the caller's two counts. */
export type ApiChannel = {
  channel_id: string;
  kind: "territory" | "credit" | "collections" | "returns" | "stock" | "general" | "dm";
  slug: string;
  name: string;
  topic: string;
  default_owner_user_id: string;
  /** Messages the caller has not read. */
  unread: number;
  /** Items still open in the channel. */
  open_items: number;
};

export type ApiMe = {
  user: ApiUser;
  channels: ApiChannel[];
};

export type ApiChannelList = { channels: ApiChannel[] };

export type ApiProvenance = {
  deterministic: boolean;
  /** Null when no model wrote it. */
  model: string | null;
  /** Null when no tool was used. */
  tool: string | null;
  evidence: string[];
  /** What the model cost, in kobo. 0 when nothing was spent. */
  cost_kobo: number;
};

export type ApiChannelMessage = {
  message_id: string;
  channel_id: string;
  author_kind: "user" | "agent" | "helper" | "system" | "shop";
  author_ref: string;
  text: string;
  /** Null when the message carries no item. */
  item_id: string | null;
  /** Null when it answers nothing. */
  reply_to: string | null;
  /** Set when this mirrors a shop message. */
  source_thread_id: string | null;
  provenance: ApiProvenance;
  created_at: string;
};

export type ApiChannelMessages = { messages: ApiChannelMessage[]; has_more: boolean };

export type ApiItemSubject = {
  shop_id?: string | null;
  relationship_id?: string | null;
  approval_id?: string | null;
  routine_id?: string | null;
  delivery_id?: string | null;
};

export type ApiItem = {
  item_id: string;
  channel_id: string;
  kind: "approval" | "finding" | "return" | "dispute" | "credit_flag" | "exception" | "task";
  state: "flagged" | "assigned" | "actioned" | "closed" | "dropped";
  severity: "low" | "normal" | "high" | "critical";
  title: string;
  body: string;
  subject: ApiItemSubject;
  /** The user who owns it. "" when unassigned. */
  owner_user_id: string;
  created_by_kind: "user" | "agent" | "helper" | "system";
  created_by_ref: string;
  source: string;
  /** ISO with zone, "" when no due time was set. */
  due_at: string;
  sla_minutes: number;
  created_at: string;
  updated_at: string;
  /** "" while open. */
  closed_at: string;
  closed_by_user_id: string;
  closed_reason: "" | "done" | "duplicate" | "not_needed" | "reassigned_elsewhere";
};

export type ApiItemList = { items: ApiItem[]; as_of: string };

export type ApiDigest = {
  for_user_id: string;
  generated_at: string;
  lines: string[];
};

/**
 * Everything one Command read returns. In the API build this is assembled from the routes above; in
 * the preview it is the fixture in content/command-mock.ts. Either way the mapper reads this shape.
 */
export type ApiCommandBundle = {
  me: ApiMe;
  users: ApiUser[];
  /**
   * Display words for every ref the bundle uses (a user id, `mimi`, a helper id, a shop ref), so no
   * screen ever shows a machine id. A ref with no name here reads as a neutral word, never as the id.
   */
  names: Record<string, string>;
  channels: ApiChannel[];
  messages: ApiChannelMessage[];
  items: ApiItem[];
  digest: ApiDigest;
  /** When the API read the items, ISO with zone. Optional: not every route sends it. */
  as_of?: string;
};
