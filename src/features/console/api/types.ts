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
  /** Handoffs contract (handoffs-2026-10-30.1): one per turn, oldest first. Absent on older APIs. */
  handoffs?: ApiHandoff[];
};

/* ---------- handoffs contract (MIMI-AGENT docs/HANDOFFS.md, contract handoffs-2026-10-30.1) ---------- */

export type ApiHandoff = {
  handoff_id: string;
  contract: string;
  from_helper: string;
  to_helper: string;
  to_title: string;
  skill: string;
  reason: string;
  via: string;
  hop: number;
  status: string;
  started_at?: string;
  finished_at?: string;
};

export type ApiIntent = { kind: "turn" | "open" | string; text: string; assign_to: string; target: string };
export type ApiChip = { label: string; tier: string; intent: ApiIntent };

export type ApiCardShopRow = {
  shop_id: string;
  name: string;
  owed_kobo: number;
  owed_naira?: string;
  overdue_kobo: number;
  overdue_naira?: string;
  days_late: number;
  credit_limit_kobo: number;
  credit_limit_naira?: string;
  open_invoices: number;
};

export type ApiCardItem = {
  item_id: string;
  label: string;
  qty: number | null;
  unit: string;
  status: string;
  amount_kobo: number | null;
  amount_naira?: string;
  shop_id: string;
};

export type ApiCard = {
  kind: "shop_row" | "list" | string;
  title: string;
  skill: string;
  shop_row: ApiCardShopRow | null;
  items: ApiCardItem[];
  total: number;
  total_kobo?: number | null;
  total_naira?: string;
  empty_text: string;
  actions?: { action: string; label: string; tier: string; intent: ApiIntent }[];
  as_of?: string;
  source?: string;
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
  /* handoffs contract: absent on older APIs (the console then shows the plain reply) */
  handoff?: ApiHandoff | null;
  card?: ApiCard | null;
  chips?: ApiChip[];
  task_status?: string;
};

export type ApiMediaKind = "image" | "voice" | "document";

/** POST /v1/media (demo): where the API kept one console attachment. */
export type ApiMedia = { ref: string; sha256: string; mime: string; kind: ApiMediaKind; size: number };

export type ApiTurnIn = {
  message_id: string;
  /** Handoffs contract: the owner (or a chip) picks the helper. Sent only when set. */
  assign_to?: string;
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
  /** Demo wiring: `zoho_payment`, `credit_over_limit`, or the tool name for older items. */
  kind?: string;
  /** True only for a pending `credit_over_limit` (the order is held over the limit). */
  blocked?: boolean;
  /** What ran on approve: a Zoho record or a limit change, with whether it can still be undone. */
  result?: ApiApprovalResult | null;
};

export type ApiApprovalResult = {
  zoho_payment_id?: string;
  change_id?: string;
  old_limit_ngn?: number;
  new_limit_ngn?: number;
  undo_available?: boolean;
  undone_at?: string;
  demo?: boolean;
  /* a `return_credit`: the credit the approve applied, and where the rest went */
  credit_id?: string;
  applied_kobo?: number;
  on_account_kobo?: number;
  applied_at?: string;
};

/** POST /v1/credit/{shop_id}/limit and POST /v1/credit/changes/{change_id}/undo. */
export type ApiLimitChange = { shop_id: string; old_limit_ngn: number; new_limit_ngn: number; change_id: string; undone?: boolean };

/** How sure a payment is, in the demo's words (`proof_grade`). */
export type ApiProofGrade = "verified" | "estimated" | "unverified";

export type ApiConnectorConnection = { connection_id: string; status: string; region: string; connected_at: string; revoked_at: string | null };
export type ApiConnectorToolkit = {
  toolkit: string;
  label: string;
  blurb: string;
  reads: string[];
  writes: string[];
  connections: ApiConnectorConnection[];
  /** Whether this server can start a real connect flow for the toolkit (absent on older APIs: not available). */
  connect?: { available: boolean; reason?: string };
};
/** GET /v1/connectors/callback: the connection saved after consent. */
export type ApiConnectorCallback = { connection_id: string; status: string; next?: string };
/** GET /v1/connectors/{id}/read: a live read from the connected account, proving Mimi can see it. */
export type ApiConnectorRead = { connection_id: string; toolkit: string; read_at: string; summary: string; items: { label: string; detail?: string }[] };
export type ApiConnectorList = { connectors: ApiConnectorToolkit[] };
export type ApiConnect = { redirect_url: string; state: string };

export type ApiPolicyRule = {
  action_type: string;
  helper: string;
  label: string;
  /** act | act_if_preapproved | ask | hand_off, or never for a built-in stop. */
  behaviour: string;
  default: string;
  locked: boolean;
  allowed: string[];
  changed_by: string;
  changed_at: string;
};
export type ApiPolicy = { rules: ApiPolicyRule[]; editable: boolean; changes: { action_type: string; from: string; to: string; by: string; at: string }[] };

export type ApiEventIn = { event_id: string; kind: "routine" | "webhook"; name: string; shop_id?: string; amount_ngn?: number };

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
  overdue_ngn?: number;
  overdue_days?: number;
  credit_limit_ngn?: number;
  outstanding_ngn?: number;
};

export type ApiShopList = {
  shops: ApiShop[];
  /** The API's own sums (mimi/owed.py): the book's definition of owed and overdue. */
  owed_total_kobo?: number;
  owed_total_naira?: string;
  overdue_total_kobo?: number;
  overdue_total_naira?: string;
};

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
  amount_ngn?: number;
  proof_level?: string;
  proof_grade?: ApiProofGrade | string;
  overdue_days?: number;
  overdue_ngn?: number;
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
  credit_limit_ngn?: number;
  outstanding_ngn?: number;
  overdue_ngn?: number;
  overdue_days?: number;
};

/* ---------- returns (GET /v1/returns; the console's one wiring point is lib/returns-contract.ts) ---------- */

export type ApiReturnLine = {
  item: string;
  unit: string;
  quantity_drafted: number;
  quantity_collected: number;
  quantity_returned: number;
  reason: string;
  unit_price_kobo: number;
  value_drafted_kobo: number;
  value_returned_kobo: number;
  /** resellable | damaged | expired */
  condition: string;
  /** resell | write_off | return_to_supplier */
  disposition: string;
  expires_on?: string;
  /** invoice | estimated: a fact off the distributor's invoice, or our guess */
  expiry_source?: string;
  batch?: string;
};

export type ApiReturnTransition = { status: string; at: string; by: string; note: string };

export type ApiReturn = {
  return_id: string;
  shop_id: string;
  shop_name: string;
  /** slow_stock | manual */
  source: string;
  approval_id?: string;
  /** A plain sentence; never an id. */
  reason: string;
  /** drafted | approved | collected | inspected | settled | cancelled */
  status: string;
  lines: ApiReturnLine[];
  value_drafted_kobo: number;
  value_collected_kobo: number;
  value_returned_kobo: number;
  credit_kobo: number;
  credit_approval_id?: string;
  credit_applied_kobo: number;
  credit_on_account_kobo: number;
  transitions: ApiReturnTransition[];
  created_at: string;
  updated_at: string;
};

export type ApiReturnList = { returns: ApiReturn[]; total: number };

/* ---------- exposure (GET /v1/credit/exposure) ---------- */

/**
 * One ageing band. The API sends `null` for an open end: the current band has no lower bound and
 * the oldest band has no upper one. It is typed `number | null` so every reader has to say what it
 * shows when the bound is absent, rather than printing a nought that reads as a range of no days.
 */
export type ApiExposureBucket = {
  key: string;
  label: string;
  from_days: number | null;
  to_days: number | null;
  weight_pct: number;
};

export type ApiExposureRow = {
  shop_id?: string;
  shop_name?: string;
  outstanding_kobo: number;
  outstanding_naira?: string;
  overdue_kobo: number;
  overdue_naira?: string;
  oldest_days_overdue: number;
  /** One money field per bucket key (kobo). */
  buckets: Record<string, number>;
  /** The age-weighted figure: an assumption, not money anyone owes. */
  exposure_kobo: number;
  exposure_naira?: string;
  verified_paid_kobo: number;
  shown_not_counted_kobo: number;
  open_invoices: number;
  confidence?: string;
  note?: string;
};

export type ApiExposure = {
  as_of: string;
  policy_version?: string;
  buckets: ApiExposureBucket[];
  shops: ApiExposureRow[];
  total: ApiExposureRow;
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

/** GET /v1/me: the caller and, in demo mode, today's demo allowance (kobo). */
export type ApiMe = {
  tenant_id: string;
  role: string;
  mode: "live" | "demo" | string;
  demo?: {
    expires_at: string | null;
    ip_spent_kobo: number;
    ip_cap_kobo: number;
    global_spent_kobo: number;
    global_cap_kobo: number;
    paused: boolean;
  } | null;
};

/* ---------- computer tasks (hosted cloud browser, one per task) ---------- */

/** One line of the run log. `screenshot` is an opaque reference; the console never puts it in an <img> src. */
export type ApiComputerTaskStep = {
  index: number;
  /** The plain sentence a person reads. Optional: a step may arrive without one (the screen says so). */
  action?: string | null;
  url?: string | null;
  note?: string | null;
  screenshot?: string | null;
};

/** A file the task produced. Read defensively: the field names are not fixed yet. */
export type ApiComputerTaskArtifact = Record<string, unknown> | string;

/**
 * One line of a task's plan. The service sends the plain words in `action` and its own machine verb
 * in `code`; the console renders `action` or `note` and never `code`.
 */
export type ApiComputerPlanStep = {
  action?: string | null;
  code?: string | null;
  url?: string | null;
  note?: string | null;
  screenshot?: string | null;
};

/** A plan line: the service's own object, or a bare string (accepted, never assumed). */
export type ApiComputerPlanLine = ApiComputerPlanStep | string;

/** GET /v1/computer/tasks/{id}. */
export type ApiComputerTask = {
  task_id: string;
  status: string;
  /** One of the kinds the service lists (see lib/computer-tasks.ts). */
  kind?: string | null;
  /** The plan, from the POST response or a later GET. */
  plan?: ApiComputerPlanLine[];
  steps?: ApiComputerTaskStep[];
  artifacts?: ApiComputerTaskArtifact[];
  /**
   * The service's own code for why it stopped. It is a code, never a sentence, so it is never shown.
   */
  stop_reason?: string | null;
  /** Why it stopped, in the service's own plain words. This is what the stop line reads. */
  note?: string | null;
  /** A signed link to watch the browser live. The service fills it only while the task runs. */
  live_view_url?: string | null;
};

/** POST /v1/computer/tasks. */
export type ApiComputerTaskIn = { goal: string; url: string; domain: string; kind: string };

/** GET /v1/computer/kinds: the service's own list of task kinds and their labels. */
export type ApiComputerKinds = { kinds?: unknown };

/** One row of GET /v1/computer/tasks (a summary; the step log comes from the detail route). */
export type ApiComputerTaskSummary = {
  task_id: string;
  goal?: string | null;
  kind?: string | null;
  domain?: string | null;
  status?: string | null;
  created_at?: string | null;
  /** The plan, which is what the list counts as its steps. */
  plan?: ApiComputerPlanLine[];
  /** Sent by an older answer; the service's list row carries the plan instead. */
  step_count?: number | null;
  stop_reason?: string | null;
  note?: string | null;
};

/** GET /v1/computer/tasks. */
export type ApiComputerTaskList = { tasks: ApiComputerTaskSummary[] };

/* ---------- routines (GET /v1/routines) ---------- */

/**
 * One routine: the work Mimi does on her own, and when. The route is not on this server yet, so
 * every field is read defensively. The API owns the words (`name`, `schedule`, `last_finding`); the
 * console words the two times itself, in Lagos.
 */
export type ApiRoutine = {
  /** Machine id: the row's key, and what a pause or resume names. Never rendered. */
  id?: string | null;
  name?: string | null;
  /** The schedule in words, written by code: "Every day at 8:00 AM". */
  schedule?: string | null;
  paused?: boolean | null;
  /** Why it is paused, in words. Only shown when the API sends it. */
  paused_reason?: string | null;
  /** ISO 8601 with zone, or "" when it has never run. */
  last_run_at?: string | null;
  next_run_at?: string | null;
  /** What it found last time, one line a person reads. "" when it found nothing to say. */
  last_finding?: string | null;
  /**
   * The shop the last finding is about, when it is about one shop. The console links the finding to
   * that shop's page; "" or absent means the finding is about no single shop, and it stays plain
   * text. Machine data: never rendered.
   */
  last_finding_shop_id?: string | null;
};

export type ApiRoutineList = { routines?: ApiRoutine[]; as_of?: string | null };

/** The answer to pausing or resuming one routine: its own new state, in words. */
export type ApiRoutineChange = { id?: string | null; name?: string | null; paused?: boolean | null; note?: string | null };

/* ---------- two books (GET /v1/books/agreement) ---------- */

/**
 * One outstanding figure in both books. Money arrives twice, as integer kobo for code and as a
 * formatted naira string for display: the console renders the string and never a figure it built
 * itself. `null` is "this book does not know", which is never the same as nought.
 */
export type ApiBooksMoney = {
  mimi_outstanding_kobo?: number | null;
  mimi_outstanding_naira?: string | null;
  zoho_outstanding_kobo?: number | null;
  zoho_outstanding_naira?: string | null;
  difference_kobo?: number | null;
  difference_naira?: string | null;
};

export type ApiBooksRow = ApiBooksMoney & {
  shop_id?: string | null;
  shop_name?: string | null;
  /** Zoho's own contact id for the shop. Machine data: never rendered. */
  zoho_contact_id?: string | null;
};

export type ApiBooksAgreement = {
  as_of?: string | null;
  /** False when Zoho Books is not connected: the screen says so and shows no figure at all. */
  zoho_connected?: boolean | null;
  shops?: ApiBooksRow[];
  total?: ApiBooksMoney | null;
  currency?: string | null;
  note?: string | null;
};
