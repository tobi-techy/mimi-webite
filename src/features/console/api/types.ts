/**
 * Response shapes of the MIMI-AGENT API (docs/API.md and docs/api/openapi.json on
 * feat/console-api-demo-mode). Times are strings like "Thu 2026-10-29 10:39 AM WAT (UTC+01:00)";
 * money comes in kobo (integers) with a naira string beside it.
 */

export type ApiThreadStatus = "needs_you" | "running" | "done";

export type ApiThreadSummary = {
  thread_id: string;
  kind: string;
  shop_id: string;
  shop_name: string;
  last_at: string;
  last_text: string;
  last_sender: string;
  messages: number;
  pending_approvals: number;
  helper: string;
  helper_name: string;
  status: ApiThreadStatus | string;
  title: string;
};

export type ApiThreadList = { threads: ApiThreadSummary[]; total: number };

export type ApiMessage = {
  message_id: string;
  direction: "in" | "out" | string;
  sender: string;
  channel: string;
  shop_id: string;
  text: string;
  kind: string;
  status: string;
  turn_id: string | null;
  simulated: boolean;
  at: string;
  /** A reply read aloud: GET /v1/messages/{id}/voice (bearer in the header). */
  voice?: boolean;
  /** Demo: the owner's console attachment, GET /v1/messages/{id}/media. */
  media?: boolean;
};

export type ApiStep = {
  event_id: string;
  turn_id: string | null;
  run_id: string;
  type: string;
  step: number;
  tool: string;
  tier: string;
  short: string;
  model: string;
  cost_kobo: number;
  duration_ms: number;
  at: string;
};

export type ApiTurnRow = {
  turn_id: string;
  state: string;
  status: string;
  helper: string;
  skill: string;
  run_id: string;
  attempts: number;
  simulated: boolean;
  created_at: string;
  finished_at: string | null;
};

export type ApiThreadDetail = {
  thread: ApiThreadSummary;
  state: Record<string, unknown>;
  messages: ApiMessage[];
  steps: ApiStep[];
  turns: ApiTurnRow[];
};

export type ApiReply = {
  message_id: string;
  channel: string;
  shop_id: string;
  text: string;
  kind: string;
  status: "ready" | "pending_approval" | string;
  at: string;
  voice: unknown;
};

export type ApiTurn = {
  turn_id: string;
  thread_id: string;
  state: string;
  status: string;
  duplicate: boolean;
  merged_into: string;
  helper: string;
  skill: string;
  run_id: string;
  attempts: number;
  replies: ApiReply[];
  route: Record<string, unknown>;
  error: string;
};

export type ApiMediaKind = "image" | "voice" | "document";

/** POST /v1/media (demo): where the API kept one console attachment. */
export type ApiMedia = { ref: string; sha256: string; mime: string; kind: ApiMediaKind; size: number };

export type ApiTurnIn = {
  message_id: string;
  source: "owner_message" | "shop_message" | "rep_message";
  text: string;
  phone?: string;
  media?: { kind: ApiMediaKind; ref: string; sha256: string; mime: string; caption?: string };
};

export type ApiApprovalStatus = "pending" | "approved" | "rejected" | "superseded" | "withdrawn";

export type ApiApproval = {
  approval_id: string;
  status: ApiApprovalStatus | string;
  helper: string;
  skill: string;
  shop_id: string;
  thread_id: string;
  turn_id: string;
  tool: string;
  intent_kind: string;
  preview: string;
  payload: Record<string, unknown>;
  draft: { text: string; channel: string; status: string } | null;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  note: string;
  supersedes: string | null;
  superseded_by: string | null;
};

export type ApiApprovalList = { approvals: ApiApproval[]; total: number };
export type ApiDecision = { approval: ApiApproval; follow_up: ApiTurn | null };

export type ApiShop = {
  shop_id: string;
  name: string;
  owner: string;
  area: string;
  shop_type: string;
  size: string;
  rep_id: string;
  phone_last4: string;
  credit_limit_kobo: number;
  credit_limit_naira: string;
  outstanding_kobo: number;
  outstanding_naira: string;
  overdue_kobo: number;
  overdue_naira: string;
  open_invoices: number;
  simulated: boolean;
};

export type ApiShopList = { shops: ApiShop[] };

export type ApiReceivable = {
  delivery_id: string;
  due_on: string;
  days_overdue: number;
  total_kobo: number;
  paid_kobo: number;
  outstanding_kobo: number;
  status: string;
};

export type ApiPayment = {
  payment_id: string;
  paid_on: string;
  amount_kobo: number;
  claimed_kobo: number;
  method: string;
  status: string;
  bank_confirmed: boolean;
};

export type ApiDispute = { dispute_id: string; delivery_id: string; sku: string; missing: number; text: string; status: string };

export type ApiShopDetail = {
  shop: ApiShop;
  thread_id: string;
  receivables: ApiReceivable[];
  payments: ApiPayment[];
  promises: Record<string, unknown>[];
  deliveries: Record<string, unknown>[];
  disputes: ApiDispute[];
};

export type ApiCreditLimit = {
  shop_id: string;
  name: string;
  credit_limit_kobo: number;
  outstanding_kobo: number;
  available_kobo: number;
  used_pct: number;
};

export type ApiCreditRequest = {
  request_id: string;
  shop_id: string;
  amount_kobo: number;
  amount_naira: string;
  reason: string;
  status: string;
  approval_id: string;
  created_at: string;
};

export type ApiCredit = { limits: ApiCreditLimit[]; requests: ApiCreditRequest[] };

export type ApiDemoSession = {
  token: string;
  tenant_id: string;
  mode: "demo";
  expires_at: string;
  ttl_s: number;
  caps: { ip_daily_cap_kobo: number; global_daily_cap_kobo: number };
};

export type ApiMe = {
  tenant_id: string;
  role: string;
  mode: "live" | "demo";
  demo?: {
    expires_at: string;
    ip_spent_kobo: number;
    ip_cap_kobo: number;
    global_spent_kobo: number;
    global_cap_kobo: number;
    paused: boolean;
  };
};
