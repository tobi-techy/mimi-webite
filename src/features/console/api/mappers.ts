/**
 * Pure mappers from MIMI-AGENT API responses to the console's existing demo types, so every
 * screen keeps rendering with the same components. Type imports only (no runtime imports), so
 * `node --test` can run the tests in mappers.test.ts without a bundler.
 *
 * Rule: never invent a figure. A value the API does not have (sell-through, score, sales this week)
 * is marked through `Shop.live` and the screens show a dash instead.
 */
import type { CreditLine, CreditRecommendation } from "../content/credit";
import type { LiveShopExtra, Shop, ShopStatus } from "../content/shops";
import type { CardStatus, Conversation, DecisionCard, Folder, HelperName, Message, ThreadState } from "../demo/types";
import type {
  ApiApproval,
  ApiCredit,
  ApiMessage,
  ApiShop,
  ApiShopDetail,
  ApiStep,
  ApiThreadDetail,
  ApiThreadSummary,
} from "./types";

type Roster = HelperName | "Mimi";

/* ---------- time ---------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "Thu 2026-10-29 10:39 AM WAT (UTC+01:00)" (the API's display form) or an ISO time, to epoch ms.
 * A bare date ("2026-10-24") is noon UTC that day so it never slips a day. Null when unreadable.
 */
export function parseApiTime(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?.*?UTC([+-])(\d{2}):(\d{2})/i.exec(s);
  if (m) {
    const [, y, mo, d, hh, mm, ap, sign, oh, om] = m;
    let h = Number(hh) % 12;
    if (!ap) h = Number(hh);
    else if (ap.toUpperCase() === "PM") h += 12;
    const offset = (sign === "-" ? -1 : 1) * (Number(oh) * 60 + Number(om));
    return Date.UTC(Number(y), Number(mo) - 1, Number(d), h, Number(mm)) - offset * 60_000;
  }
  const bare = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (bare) return Date.UTC(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]), 12);
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

/** Sidebar age in the demo's form: "now", "4m", "2h", "3d", "1w". */
export function agoLabel(at: number | null, now: number): string {
  if (at === null) return "now";
  const min = Math.max(0, Math.floor((now - at) / 60_000));
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  if (min < 10080) return `${Math.floor(min / 1440)}d`;
  return `${Math.floor(min / 10080)}w`;
}

/** "10:39" on a 12-hour clock, Lagos time (the console's own clock style, no am/pm). */
export function clockLabel(at: number): string {
  const d = new Date(at + 60 * 60_000); // Africa/Lagos is UTC+1 all year
  const h = d.getUTCHours() % 12 || 12;
  return `${h}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** "Oct 24" for a date the API gives (Lagos calendar day). */
export function shortDate(s: string): string {
  const at = parseApiTime(s);
  if (at === null) return s;
  const d = new Date(at + 60 * 60_000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** Date line in the thread: "Today 10:39", "Yesterday 4:02" or "Oct 24 9:15". */
export function dateLine(at: number, now: number): string {
  const day = (t: number) => Math.floor((t + 60 * 60_000) / 86_400_000);
  const diff = day(now) - day(at);
  const when = diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : shortDate(new Date(at).toISOString());
  return `${when} ${clockLabel(at)}`;
}

/* ---------- money ---------- */

export const koboToNaira = (kobo: number | null | undefined): number => Math.round((kobo ?? 0) / 100);
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

/* ---------- helpers, folders, states ---------- */

const HELPERS: Record<string, Roster> = {
  mimi: "Mimi",
  collector: "Collector",
  order: "Order",
  proof: "Proof",
  stock: "Stock",
  credit: "Credit",
  brand: "Brand",
  promo: "Brand",
};

/** The API's helper ("collector", "Collector", "brand/promo-info") to a console helper. Unknown is Mimi. */
export function helperOf(name: string | null | undefined): Roster {
  const key = (name ?? "").trim().toLowerCase().split(/[/:\s]/)[0] ?? "";
  return HELPERS[key] ?? "Mimi";
}

export const folderOf: Record<Roster, Folder> = {
  Collector: "Collections",
  Proof: "Proof",
  Order: "Orders",
  Credit: "Credit",
  Stock: "Stock",
  Brand: "Brands",
  Mimi: "General",
};

const codeOf: Record<Roster, string> = {
  Collector: "COL",
  Proof: "PRF",
  Order: "ORD",
  Credit: "CRD",
  Stock: "STK",
  Brand: "BRD",
  Mimi: "MIM",
};

/** needs_you, running, done to the sidebar's states. */
export function stateOf(status: string): ThreadState {
  if (status === "needs_you") return "needs";
  if (status === "running") return "run";
  if (status === "done") return "done";
  return "idle";
}

const statusLine: Record<ThreadState, string> = {
  needs: "waiting on you",
  run: "working on it",
  done: "done",
  idle: "waiting for your next message",
};

/** The owner's own thread is always Mimi's; shop threads follow the newest routed helper. */
const threadHelper = (t: ApiThreadSummary): Roster => (t.kind === "owner" ? "Mimi" : helperOf(t.helper || t.helper_name));

/* ---------- threads ---------- */

/** A thread in the list before its messages load (also the base of `mapThread`). */
export function mapThreadSummary(t: ApiThreadSummary, now: number): Conversation {
  const helper = threadHelper(t);
  const state = stateOf(t.status);
  const at = parseApiTime(t.last_at);
  const num = (t.shop_id.match(/(\d+)$/)?.[1] ?? "0").padStart(3, "0");
  return {
    slug: t.thread_id,
    title: t.title || t.shop_name || "Thread",
    helper,
    folder: folderOf[helper],
    code: `${codeOf[helper]}-${num}`,
    state,
    status: statusLine[state],
    working: state === "run",
    ago: agoLabel(at, now),
    created: true,
    preview: t.last_text || (t.messages === 0 ? "No messages yet" : t.title),
    messages: at !== null ? [{ id: `api-d:${t.thread_id}`, kind: "date", label: dateLine(at, now) }] : [],
    api: { threadId: t.thread_id, kind: t.kind, shopId: t.shop_id, shopName: t.shop_name },
  };
}

/** Which kind of decision card an approval's tool reads as. */
export function cardKindOf(tool: string): DecisionCard["kind"] {
  const t = tool.toLowerCase();
  if (t.includes("flag_payment") || t.includes("proof")) return "flag";
  if (t.includes("restock") || t.includes("stock")) return "stock";
  if (t.includes("credit") || t.includes("allowance")) return "credit";
  if (t.includes("brand")) return "brand";
  if (t.includes("deliver") || t.includes("order")) return "order";
  return "plan";
}

/** The first naira figure in an approval's payload (any `*_kobo` number), or undefined. */
export function payloadAmount(payload: Record<string, unknown>): number | undefined {
  for (const [k, v] of Object.entries(payload ?? {})) {
    if (k.endsWith("_kobo") && typeof v === "number" && v > 0) return koboToNaira(v);
  }
  return undefined;
}

const cardStatusOf = (s: string): CardStatus | null =>
  s === "pending" ? "needs" : s === "approved" ? "sent" : s === "rejected" ? "declined" : null;

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** One approval as a decision card (Approve / Discard). Superseded and withdrawn ones are left out. */
export function mapApprovalCard(a: ApiApproval, shopName: string): DecisionCard | null {
  const status = cardStatusOf(a.status);
  if (!status) return null;
  const kind = cardKindOf(a.tool || a.intent_kind);
  const amount = payloadAmount(a.payload);
  const helper = helperOf(a.helper);
  const who = shopName || "Your business";
  const decided = parseApiTime(a.decided_at);
  const rows: DecisionCard["rows"] = [{ label: who, amount, note: helper === "Mimi" ? "Mimi" : helper }];
  if (a.draft?.text) rows.push({ label: "Draft", note: short(a.draft.text, 90) });
  const subject = typeof a.payload?.subject === "string" ? a.payload.subject : "";
  const body = typeof a.payload?.body === "string" ? a.payload.body : a.draft?.text ?? "";
  const to = typeof a.payload?.to === "string" ? a.payload.to : typeof a.payload?.brand === "string" ? a.payload.brand : "";
  return {
    kind,
    tier: "Approve",
    shop: shopName || undefined,
    amount,
    why: a.note || undefined,
    title: short((a.preview || a.tool || "Approval").split("\n")[0] ?? "Approval", 80),
    sub: `${who} · ${status === "needs" ? "nothing sent yet" : status === "sent" ? "approved" : "declined"}`,
    rows,
    email: kind === "brand" && subject ? { to: to || "Brand", subject, body } : undefined,
    message: a.draft?.text ? { to: who, tone: "Firm", text: a.draft.text } : undefined,
    primary: "Approve",
    secondary: "Decline",
    status,
    sentAt: decided !== null ? clockLabel(decided) : undefined,
    doneText: a.draft ? "Approved, Mimi sends it" : "Approved by you",
  };
}

const STEP_ICONS: [RegExp, NonNullable<Extract<Message, { kind: "step" }>["icon"]>][] = [
  [/route|router/, "refresh-cw"],
  [/screenshot|proof|payment|bank/, "landmark"],
  [/send|reply|whatsapp|message/, "send"],
  [/stock|restock/, "package"],
  [/deliver|receipt|order/, "truck"],
  [/credit|shelf/, "shield-check"],
  [/brand|promo|email/, "pen"],
  [/owe|receivable|invoice|debt|promise|chase/, "receipt"],
];

const stepIcon = (s: ApiStep) => {
  const hay = `${s.tool} ${s.type} ${s.short}`.toLowerCase();
  return STEP_ICONS.find(([re]) => re.test(hay))?.[1] ?? "list-checks";
};

const stepVariant = (s: ApiStep): Extract<Message, { kind: "step" }>["variant"] => {
  const t = `${s.type} ${s.tier}`.toLowerCase();
  if (t.includes("error") || t.includes("fail")) return "error";
  if (t.includes("retry")) return "retry";
  if (t.includes("handoff") || t.includes("route")) return "handoff";
  if (t.includes("approve") || t.includes("gate")) return "gate";
  return "tool";
};

function mapStep(s: ApiStep, from: Roster): Message {
  const at = parseApiTime(s.at) ?? 0;
  const variant = stepVariant(s);
  const tierNote = s.tier && s.tier !== "none" ? s.tier : "";
  return {
    id: `api-s:${s.event_id}`,
    kind: "step",
    from,
    at,
    variant: variant === "handoff" ? "tool" : variant,
    icon: stepIcon(s),
    text: short(s.short || s.tool || s.type, 72),
    state: variant === "error" ? "failed" : "done",
    meta: tierNote || undefined,
    tool: s.tool || undefined,
    took: s.duration_ms > 0 ? `${(s.duration_ms / 1000).toFixed(1)}s` : undefined,
    cost: s.cost_kobo > 0 ? s.cost_kobo / 100 : undefined,
  };
}

/** A finished turn's work: one collapsed "Thought for Ns" line that opens to the list of steps. */
export function foldSteps(turn: string, steps: ApiStep[], from: Roster): Message {
  const ms = steps.reduce((n, s) => n + (s.duration_ms || 0), 0);
  const text = steps.map((s) => `- ${short(s.short || s.tool || s.type, 90).replace(/[*_`=\[\]]/g, "")}`).join("\n");
  return { id: `api-w:${turn}`, kind: "thought", from: from === "Mimi" ? "Mimi" : from, at: parseApiTime(steps[0]?.at) ?? 0, text, secs: Math.max(1, Math.round(ms / 1000)) };
}

const WHO: Record<string, string> = { rep: "Rep", shop: "Shop", system: "System" };

const MEDIA_PLACEHOLDER = /^\[(image|voice|document)\]$/;

/** The owner's own attachment from the console (demo): played or shown through the API, with the bearer in a header. */
function ownerMedia(m: ApiMessage, id: string, at: number): Message | null {
  const caption = MEDIA_PLACEHOLDER.test(m.text) ? "" : m.text;
  const apiId = m.message_id;
  if (/image|photo/.test(m.kind)) return { id, kind: "photos", from: "me", at, label: "1 Photo", photos: [], remote: apiId, apiId };
  if (/voice|audio/.test(m.kind))
    return { id, kind: "voice", from: "me", at, seconds: 0, caption: "Your voice note", transcript: caption || undefined, audio: { from: "media", id: apiId }, apiId };
  if (/doc/.test(m.kind)) return { id, kind: "file", from: "me", at, name: caption || "Document", mime: "application/pdf", size: 0, remote: apiId, apiId };
  return null;
}

function mapMessage(m: ApiMessage, from: Roster, shopName: string, local?: ReadonlyMap<string, Message>): Message | null {
  const at = parseApiTime(m.at) ?? 0;
  const id = `api-m:${m.message_id}`;
  if (m.direction === "in" && m.sender === "owner") {
    /* an attachment sent from this tab keeps its own preview; anything else is read from the API */
    const mine = local?.get(m.message_id);
    if (mine) return mine;
    if (m.media) {
      const media = ownerMedia(m, id, at);
      if (media) return media;
    }
  }
  if (!m.text || (m.direction === "in" && MEDIA_PLACEHOLDER.test(m.text))) {
    /* media with no caption: say what arrived (photos and voice notes are read by the helpers) */
    const what = /image|photo/.test(m.kind) ? "a photo" : /voice|audio/.test(m.kind) ? "a voice note" : /doc/.test(m.kind) ? "a document" : "";
    if (!what || m.direction !== "in") return null;
    const who = m.sender === "owner" ? "You" : m.sender === "shop" ? shopName || "Shop" : WHO[m.sender] ?? m.sender;
    return { id, kind: "system", text: `${who} sent ${what}`, at, icon: "message-square" };
  }
  if (m.direction === "in") {
    if (m.sender === "owner") return { id, kind: "text", from: "me", text: m.text, at, read: true };
    const who = m.sender === "shop" ? shopName || "Shop" : WHO[m.sender] ?? m.sender;
    return { id, kind: "system", text: `${who}: “${m.text}”`, at, icon: "message-square" };
  }
  /* a drafted reply that waits in approvals shows as its card, not as a sent bubble */
  if (m.status === "pending_approval" || m.status === "draft") return null;
  return { id, kind: "text", from, text: m.text, at };
}

/** A reply that also went as a voice note: the note itself, played through the API on tap. */
function replyVoice(m: ApiMessage, from: Roster): Message | null {
  if (!m.voice || m.direction !== "out" || m.status === "pending_approval" || m.status === "draft") return null;
  return { id: `api-v:${m.message_id}`, kind: "voice", from, at: parseApiTime(m.at) ?? 0, seconds: 0, caption: "Voice note", audio: { from: "voice", id: m.message_id } };
}

/** Is this message's turn on its way to Mimi (sent or sending, not stored yet)? An upload still running or failed is not. */
export function inFlight(m: Message, stored: { ids: ReadonlySet<string>; texts: ReadonlySet<string> }): boolean {
  if (m.kind === "text") return !stored.texts.has(m.text);
  if (m.kind === "photos" || m.kind === "voice" || m.kind === "file")
    return (!m.upload || m.upload.state === "sending") && !(m.apiId && stored.ids.has(m.apiId));
  return false;
}

/** Still to show after the API's own messages: unsent text, and attachments the API has not stored (failed ones keep Retry). */
function stillShown(m: Message, stored: { ids: ReadonlySet<string>; texts: ReadonlySet<string> }): boolean {
  if (m.kind === "text") return !stored.texts.has(m.text);
  if (m.kind === "photos" || m.kind === "voice" || m.kind === "file") return !(m.apiId && stored.ids.has(m.apiId));
  return false;
}

/**
 * One thread with its messages, the helpers' work steps (folded in before each turn's reply) and
 * its approvals as decision cards. `pending` is a message the owner just sent that the API has not
 * stored yet (kept so the bubble does not blink out while the turn is queued).
 */
export function mapThread(d: ApiThreadDetail, approvals: ApiApproval[], now: number, pending: Message[] = [], local?: ReadonlyMap<string, Message>): Conversation {
  const base = mapThreadSummary(d.thread, now);
  const shopName = d.thread.shop_name;
  const helperByTurn = new Map(d.turns.map((t) => [t.turn_id, helperOf(t.helper)]));
  const runningTurns = new Set(d.turns.filter((t) => t.state === "running" || t.state === "queued").map((t) => t.turn_id));
  const stepsByTurn = new Map<string, ApiStep[]>();
  for (const s of d.steps) {
    const k = s.turn_id ?? "";
    stepsByTurn.set(k, [...(stepsByTurn.get(k) ?? []), s]);
  }
  const fromOf = (turn: string | null): Roster => {
    const h = turn ? helperByTurn.get(turn) : undefined;
    return h && h !== "Mimi" ? h : base.helper;
  };

  const out: Message[] = [];
  const emitted = new Set<string>();
  const emitSteps = (turn: string) => {
    if (emitted.has(turn)) return;
    emitted.add(turn);
    const steps = stepsByTurn.get(turn) ?? [];
    if (!steps.length) return;
    /* while the turn runs its steps show one by one; once done they fold into one line */
    if (runningTurns.has(turn)) for (const s of steps) out.push(mapStep(s, fromOf(turn)));
    else out.push(foldSteps(turn, steps, fromOf(turn)));
  };
  d.messages.forEach((m, i) => {
    const turn = m.turn_id ?? "";
    if (m.direction === "out" && turn) emitSteps(turn);
    const mapped = mapMessage(m, fromOf(m.turn_id), shopName, local);
    if (mapped) out.push(mapped);
    const spoken = replyVoice(m, fromOf(m.turn_id));
    if (spoken) out.push(spoken);
    /* a turn with no reply yet: its steps go right after its last inbound message */
    const next = d.messages[i + 1];
    if (turn && m.direction === "in" && (!next || (next.turn_id ?? "") !== turn)) {
      if (!d.messages.some((x) => x.direction === "out" && x.turn_id === turn)) emitSteps(turn);
    }
  });
  for (const turn of stepsByTurn.keys()) if (turn) emitSteps(turn);

  for (const a of approvals) {
    if (a.thread_id !== d.thread.thread_id) continue;
    const card = mapApprovalCard(a, shopName);
    if (!card) continue;
    out.push({ id: `apr:${a.approval_id}`, kind: "card", from: helperOf(a.helper), at: parseApiTime(a.created_at) ?? 0, card });
  }

  const stored = { ids: new Set(d.messages.map((m) => m.message_id)), texts: new Set(d.messages.map((m) => m.text)) };
  const shown = pending.filter((p) => stillShown(p, stored));
  const stillPending = shown.filter((p) => inFlight(p, stored));

  const firstAt = parseApiTime(d.messages[0]?.at) ?? parseApiTime(d.thread.last_at);
  const date: Message[] = firstAt !== null ? [{ id: `api-d:${d.thread.thread_id}`, kind: "date", label: dateLine(firstAt, now) }] : [];
  const anyPending = approvals.some((a) => a.thread_id === d.thread.thread_id && a.status === "pending");
  const state = stillPending.length ? "run" : anyPending ? "needs" : base.state;
  return {
    ...base,
    state,
    status: stillPending.length ? "reading your message" : statusLine[state],
    working: state === "run",
    messages: [...date, ...out, ...shown],
  };
}

/** What the thread's helper is doing now: the newest step of a running turn, for the thinking line. */
export function liveActivity(d: ApiThreadDetail): string | null {
  const running = d.turns.filter((t) => t.state === "running" || t.state === "queued");
  if (!running.length) return null;
  const ids = new Set(running.map((t) => t.turn_id));
  const steps = d.steps.filter((s) => s.turn_id && ids.has(s.turn_id));
  const last = steps.at(-1);
  return last ? (last.short || last.tool || "working on it").replace(/\.$/, "") : running.some((t) => t.state === "running") ? "thinking" : "reading your message";
}

/* ---------- shops ---------- */

export function shopStatusOf(s: Pick<ApiShop, "overdue_kobo" | "outstanding_kobo" | "credit_limit_kobo">): ShopStatus {
  if (s.overdue_kobo > 0) return "o";
  if (s.credit_limit_kobo > 0 && s.outstanding_kobo > s.credit_limit_kobo * 0.8) return "w";
  return "g";
}

/** "rep-1" to "Rep 1": the console's route tabs group live shops by the rep who covers them. */
export const routeOf = (rep: string): string => (rep ? rep.replace(/^rep-?/i, "Rep ").trim() : "No rep");

export function mapShop(s: ApiShop, detail?: ApiShopDetail): Shop {
  const payments = (detail?.payments ?? []).map((p) => ({
    date: shortDate(p.paid_on),
    amount: koboToNaira(p.amount_kobo || p.claimed_kobo),
    verified: p.bank_confirmed,
  }));
  const live: LiveShopExtra = {
    creditLimit: koboToNaira(s.credit_limit_kobo),
    overdue: koboToNaira(s.overdue_kobo),
    openInvoices: s.open_invoices,
    shopType: s.shop_type,
    threadId: detail?.thread_id,
    receivables: detail?.receivables
      .filter((r) => r.outstanding_kobo > 0)
      .map((r) => ({ id: r.delivery_id, due: shortDate(r.due_on), daysOverdue: r.days_overdue, outstanding: koboToNaira(r.outstanding_kobo) })),
    disputes: detail?.disputes.filter((x) => x.status === "open").map((x) => x.text),
  };
  return {
    id: s.shop_id,
    name: s.name,
    area: s.area,
    route: routeOf(s.rep_id),
    owner: s.owner,
    whatsapp: s.phone_last4 ? `ending ${s.phone_last4.replace(/^\*+/, "")}` : "",
    sellThrough: 0,
    owed: koboToNaira(s.outstanding_kobo),
    score: 0,
    lastPayment: payments[0]?.date ?? "—",
    status: shopStatusOf(s),
    salesThisWeek: 0,
    avgDaysToPay: 0,
    payments,
    live,
  };
}

/* ---------- credit ---------- */

/** Credit lines from GET /v1/credit, joined to the shops list for area and outstanding. */
export function mapCreditLines(c: ApiCredit, shops: Shop[]): CreditLine[] {
  const byId = new Map(shops.map((s) => [s.id, s]));
  const asked = new Map(c.requests.filter((r) => r.status === "pending").map((r) => [r.shop_id, r]));
  return c.limits.map((l) => {
    const shop: Shop =
      byId.get(l.shop_id) ??
      ({
        id: l.shop_id,
        name: l.name,
        area: "",
        route: "No rep",
        owner: "",
        whatsapp: "",
        sellThrough: 0,
        owed: koboToNaira(l.outstanding_kobo),
        score: 0,
        lastPayment: "—",
        status: "g",
        salesThisWeek: 0,
        avgDaysToPay: 0,
        payments: [],
        live: { creditLimit: koboToNaira(l.credit_limit_kobo), overdue: 0, openInvoices: 0, shopType: "" },
      } satisfies Shop);
    const overdue = shop.live?.overdue ?? 0;
    const req = asked.get(l.shop_id);
    return {
      shop,
      limit: koboToNaira(l.credit_limit_kobo),
      due: overdue > 0 ? "Overdue" : "On time",
      late: overdue > 0,
      recommendation: req ? `Raise to ${naira(koboToNaira(req.amount_kobo))}` : "No change",
    };
  });
}

/** Pending credit requests from the Credit helper, as the recommendations the owner reviews. */
export function mapCreditRecs(c: ApiCredit): CreditRecommendation[] {
  return c.requests
    .filter((r) => r.status === "pending")
    .map((r) => ({ shopId: r.shop_id, to: koboToNaira(r.amount_kobo), verb: "Raise", why: r.reason || "Asked by the Credit helper", approvalId: r.approval_id || undefined }));
}

/* ---------- errors ---------- */

export type ErrorKind = "unreachable" | "expired" | "unauthorized" | "refused" | "capped" | "sessions" | "paused" | "conflict" | "notfound" | "other";

export function errorKind(status: number, detail = ""): ErrorKind {
  const d = detail.toLowerCase();
  if (status === 0) return "unreachable";
  if (status === 401) return d.includes("expired") ? "expired" : "unauthorized";
  if (status === 403) return "refused";
  if (status === 404) return "notfound";
  if (status === 409) return "conflict";
  if (status === 429) return d.includes("session") ? "sessions" : "capped";
  if (status === 503) return "paused";
  return "other";
}

/** What the owner reads when a call fails. Plain words, no jargon. */
export function friendlyMessage(kind: ErrorKind, detail = ""): string {
  const d = detail.toLowerCase();
  switch (kind) {
    case "unreachable":
      return "Mimi can't be reached right now, so you're seeing sample data.";
    case "expired":
      return "Your demo session ended, so Mimi started a fresh copy for you.";
    case "unauthorized":
      return "Please sign in again to keep going.";
    case "refused":
      return "The demo can't raise a credit limit or the daily budget. You can decline it instead.";
    case "capped":
      return d.includes("everyone")
        ? "The demo has used today's budget for everyone. It resets at midnight, Lagos time. You can still look around."
        : "You've used today's demo budget. It resets at midnight, Lagos time. You can still look around.";
    case "sessions":
      return "Too many demo sessions from your network today. Please come back tomorrow.";
    case "paused":
      return "The demo is paused right now. You can still look around.";
    case "conflict":
      return "That was already decided, so nothing changed.";
    case "notfound":
      return "That isn't in this demo any more.";
    default:
      return "Something went wrong. Please try again in a moment.";
  }
}
