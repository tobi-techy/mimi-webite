/**
 * Pure mappers from MIMI-AGENT API responses to the console's existing demo types, so every
 * screen keeps rendering with the same components. Type imports only (no runtime imports), so
 * `node --test` can run the tests in mappers.test.ts without a bundler.
 *
 * Rule: never invent a figure. A value the API does not have (sell-through, score, sales this week)
 * is marked through `Shop.live` and the screens show a dash instead.
 */
import type { CreditLine, CreditRecommendation } from "../content/credit";
import type { Exposure, ExposureShop } from "../content/exposure";
import type { ShopReturn } from "../content/returns";
import type { LiveShopExtra, Shop, ShopStatus } from "../content/shops";
import type { ProofGrade } from "../lib/proof";
import type { AnswerBlock, CardStatus, Conversation, DecisionCard, Folder, HelperName, Message, Reply, TableCell, ThreadState } from "../demo/types";
import type {
  ApiApproval,
  ApiCard,
  ApiChip,
  ApiCredit,
  ApiExposure,
  ApiExposureRow,
  ApiMe,
  ApiMessage,
  ApiReturn,
  ApiReturnList,
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
    /* a shop's words never show: its thread previews as the task it is */
    preview: t.kind !== "owner" ? `Task from ${t.shop_name || "a shop"}` : nairaSign(t.last_text) || (t.messages === 0 ? "No messages yet" : t.title),
    messages: at !== null ? [{ id: `api-d:${t.thread_id}`, kind: "date", label: dateLine(at, now) }] : [],
    api: { threadId: t.thread_id, kind: t.kind, shopId: t.shop_id, shopName: t.shop_name },
  };
}

/** Which kind of decision card an approval's tool reads as. */
export function cardKindOf(tool: string): DecisionCard["kind"] {
  const t = tool.toLowerCase();
  if (t.includes("return") || t.includes("credit_note")) return "return";
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

/**
 * The morning brief comes as one paragraph ("Good morning. Top overdue: A is 133 days overdue on
 * ₦2,387,250; B is …. In all ₦7,231,000 is overdue across 14 shops."): one shop per line reads
 * faster. Any other text is returned as it is.
 */
export function briefLines(text: string): string {
  const m = /^(Good morning[^.]*\.)\s*Top overdue:\s*([^]*?)\.\s*(In all [^]*)$/i.exec(text.trim());
  if (!m || text.includes("\n")) return text;
  const items = m[2]!.split(/;\s*/).map((x) => x.trim().replace(/\.$/, "")).filter(Boolean);
  if (items.length < 2) return text;
  return `${m[1]}\n\nTop overdue:\n${items.map((x) => `• ${x}`).join("\n")}\n\n${m[3]!.trim()}`;
}

const flatText = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

/* ---------- demo wiring: Zoho write and an order over its limit (shared with the demo tour) ---------- */

export type ZohoPayload = { shop_name: string; amount_ngn: number; invoice_number?: string; reference_number?: string };
export type OverLimitPayload = { shop_name: string; order_ngn: number; limit_ngn: number; owed_ngn?: number; suggested_limit_ngn: number; reasons?: string[] };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** "Record ₦500,000 from Mama Sola in Zoho Books": after approve, "Recorded in Zoho" with Undo. */
export function zohoCard(p: ZohoPayload, status: CardStatus, opts: { undo?: DecisionCard["undo"]; sentAt?: string } = {}): DecisionCard {
  const amount = Math.round(p.amount_ngn);
  const shop = nairaSign(p.shop_name) || "A shop";
  return {
    kind: "zoho",
    tier: "Approve",
    shop,
    amount,
    why: "The bank confirmed it",
    title: `Record ${naira(amount)} from ${shop} in Zoho Books`,
    sub: status === "needs" ? "The bank confirmed this payment. Nothing is written to Zoho until you approve." : "Payment the bank confirmed",
    /* the invoice number and Zoho reference are book keys: never shown (owner reads the shop and ₦) */
    rows: [{ label: "Against their open invoice", amount, proof: "verified" }],
    noTotal: true,
    primary: "Record in Zoho",
    secondary: "Decline",
    labels: { primary: "Record in Zoho", secondary: "Not now" },
    status,
    sentAt: opts.sentAt,
    doneText: "Recorded in Zoho",
    declinedText: "Not recorded",
    undo: opts.undo,
  };
}

/** An order that would take a shop over its limit: held, with Credit's suggested limit and reasons. */
export function overLimitCard(p: OverLimitPayload, status: CardStatus, opts: { undo?: DecisionCard["undo"]; sentAt?: string; newLimit?: number } = {}): DecisionCard {
  const shop = nairaSign(p.shop_name) || "A shop";
  const to = Math.round(opts.newLimit ?? p.suggested_limit_ngn);
  return {
    kind: "limit",
    tier: "Approve",
    shop,
    amount: Math.round(p.order_ngn),
    why: `Order over its ${naira(p.limit_ngn)} limit`,
    title: `Order held · ${shop}`,
    sub:
      status === "needs"
        ? `A ${naira(p.order_ngn)} order would take ${shop} over its limit. Credit suggests ${naira(p.suggested_limit_ngn)}.`
        : `${naira(p.order_ngn)} order`,
    rows: [
      { label: "Limit now", amount: Math.round(p.limit_ngn) },
      { label: "Suggested limit", amount: Math.round(p.suggested_limit_ngn) },
    ],
    reasons: (p.reasons ?? []).map((r) => nairaSign(r)).filter(Boolean).slice(0, 4),
    noTotal: true,
    primary: "Approve new limit",
    secondary: "Decline",
    labels: { primary: "Approve new limit", secondary: "Keep limit" },
    status,
    sentAt: opts.sentAt,
    doneText: `Limit now ${naira(to)}`,
    declinedText: "Limit kept",
    undo: opts.undo,
  };
}

/** The demo-wiring card for an approval, when its kind is one (null for every other approval). */
function wiredCard(a: ApiApproval, status: CardStatus, sentAt: string | undefined, undone: ReadonlySet<string>): DecisionCard | null {
  const kind = a.kind || str(a.payload?.kind);
  const r = a.result ?? null;
  if (kind === "return_credit") {
    /* Undo follows `result.undo_available` from the API, never an assumption made here */
    const undo: DecisionCard["undo"] =
      status !== "sent"
        ? undefined
        : undone.has(a.approval_id) || r?.undone_at
          ? { state: "done", text: "Credit taken back" }
          : r?.undo_available
            ? { state: "ready" }
            : undefined;
    return returnCreditCard(a, status, { undo, sentAt });
  }
  if (kind === "zoho_payment") {
    const undo: DecisionCard["undo"] =
      status !== "sent" ? undefined : r?.undone_at || undone.has(a.approval_id) ? { state: "done", text: "Taken back out of Zoho" } : r?.undo_available ? { state: "ready" } : undefined;
    return zohoCard(
      { shop_name: str(a.payload?.shop_name), amount_ngn: num(a.payload?.amount_ngn), invoice_number: str(a.payload?.invoice_number) || undefined },
      status,
      { undo, sentAt },
    );
  }
  if (kind === "credit_over_limit") {
    const changeId = r?.change_id;
    const undo: DecisionCard["undo"] =
      status !== "sent" || !changeId ? undefined : undone.has(changeId) ? { state: "done", text: `Limit back to ${naira(num(r?.old_limit_ngn) || num(a.payload?.limit_ngn))}` } : r?.undo_available !== false ? { state: "ready", changeId } : undefined;
    return overLimitCard(
      {
        shop_name: str(a.payload?.shop_name),
        order_ngn: num(a.payload?.order_ngn),
        limit_ngn: num(a.payload?.limit_ngn),
        suggested_limit_ngn: num(a.payload?.suggested_limit_ngn),
        reasons: Array.isArray(a.payload?.reasons) ? (a.payload.reasons as unknown[]).map(str) : [],
      },
      status,
      { undo, sentAt, newLimit: num(r?.new_limit_ngn) || undefined },
    );
  }
  return null;
}

/** One approval as a decision card (Approve / Discard). Superseded and withdrawn ones are left out. */
export function mapApprovalCard(a: ApiApproval, shopName: string, undone: ReadonlySet<string> = new Set()): DecisionCard | null {
  const status = cardStatusOf(a.status);
  if (!status) return null;
  const wired = wiredCard(a, status, parseApiTime(a.decided_at) !== null ? clockLabel(parseApiTime(a.decided_at)!) : undefined, undone);
  if (wired) return wired;
  const kind = cardKindOf(a.tool || a.intent_kind);
  const amount = payloadAmount(a.payload);
  const helper = helperOf(a.helper);
  const who = shopName || "Your business";
  const decided = parseApiTime(a.decided_at);
  const rows: DecisionCard["rows"] = [{ label: who, amount, note: helper === "Mimi" ? "Mimi" : helper }];
  if (a.draft?.text) rows.push({ label: "Draft", note: short(hideKeys(a.draft.text), 90) });
  const subject = typeof a.payload?.subject === "string" ? a.payload.subject : "";
  const body = typeof a.payload?.body === "string" ? a.payload.body : a.draft?.text ?? "";
  const to = typeof a.payload?.to === "string" ? a.payload.to : typeof a.payload?.brand === "string" ? a.payload.brand : "";
  return {
    kind,
    tier: "Approve",
    shop: shopName || undefined,
    amount,
    why: a.note || undefined,
    title: short(hideKeys((a.preview || a.tool || "Approval").split("\n")[0] ?? "Approval"), 80),
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
    text: short(hideKeys(s.short || s.tool || s.type), 72),
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
  const text = steps.map((s) => `- ${short(hideKeys(s.short || s.tool || s.type), 90).replace(/[*_`=\[\]]/g, "")}`).join("\n");
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

/**
 * Whether an outgoing message went out. Text to a shop shows only once it is `ready` (handed to
 * WhatsApp): a draft waiting on approval, or one declined, superseded or withdrawn, never shows on
 * the shop side. Owner-side text hides drafts and declined ones the same way.
 */
export function outShown(m: Pick<ApiMessage, "direction" | "channel" | "status">): boolean {
  if (m.direction !== "out") return true;
  if (m.channel === "shop_whatsapp") return m.status === "ready";
  return !/^(pending_approval|draft|rejected|superseded|withdrawn)$/.test(m.status);
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
  if (!outShown(m)) return null;
  const text = hideKeys(nairaSign(m.text));
  /* a helper asking the owner: shown in her chat and, as "Needs you", in Mimi's. A paused job's
     note reads as model and tool numbers, so it is asked again in plain words (Keep going / Stop) */
  const pause = plainPause(text);
  if (from !== "Mimi" && (pause || m.kind === "question"))
    return { id, kind: "ask", from, at, question: pause?.question ?? text, ...(pause ? { options: pause.options } : {}) };
  if (pause) return { id, kind: "text", from, text: pause.question, at };
  return { id, kind: "text", from, text: briefLines(text), at };
}

/**
 * A message in a shop's or rep's thread, as a line in the helper's inbox: the shop's words never
 * show. The first inbound message of a turn reads "Task from Mama Sola Stores"; a reply the helper
 * sent reads "Collector replied to Mama Sola Stores". Exported for tests.
 */
export function taskLine(m: ApiMessage, from: Roster, shopName: string, tasked: Set<string>): Message | null {
  const at = parseApiTime(m.at) ?? 0;
  const turn = m.turn_id ?? undefined;
  const who = shopName || "a shop";
  if (m.direction === "in") {
    const key = turn ?? m.message_id;
    if (tasked.has(key)) return null;
    tasked.add(key);
    return { id: `api-t:${m.message_id}`, kind: "system", text: `Task from ${who}`, at, icon: "message-square", ...(turn ? { turn } : {}) };
  }
  if (!outShown(m)) return null;
  return { id: `api-m:${m.message_id}`, kind: "system", text: `${from} replied to ${who}`, at, icon: "check", ...(turn ? { turn } : {}) };
}

/** A reply that also went as a voice note: the note itself, played through the API on tap. */
function replyVoice(m: ApiMessage, from: Roster): Message | null {
  if (!m.voice || m.direction !== "out" || !outShown(m)) return null;
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

const clipText = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** "Handed to Order: any new orders today" from the owner's ask (the task in her own words). */
export function handoffText(to: string, ask?: string): string {
  const t = (ask ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?.!\s]+$/, "");
  if (!t) return `Handed to ${to}`;
  return `Handed to ${to}: ${clipText(t.charAt(0).toLowerCase() + t.slice(1), 64)}`;
}


/**
 * The paused-job notes the API writes in code ("I paused collector: this job has used ₦32.56 of
 * its ₦50.00 model budget… Keep going?") read as model and tool numbers to a distributor. This
 * gives the same question in plain words with two buttons, or null for any other text. The
 * buttons send the words the API already understands ("keep going", "stop"); nothing about the
 * budget itself changes.
 */
export function plainPause(text: string): { question: string; options: { label: string; text: string }[] } | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (/^I paused \w+(?::| after)/i.test(t) && /Keep going\?$/i.test(t))
    return {
      question: "I stopped to check with you before doing more on this job. Nothing was lost, and nothing more goes out until you say so. Should I keep going?",
      options: [
        { label: "Keep going", text: "keep going" },
        { label: "Stop", text: "stop" },
      ],
    };
  if (/^I stopped \w+ on this job because/i.test(t) && /keep going/i.test(t))
    return {
      question: "I stopped because I kept trying the same step. Nothing more was sent. Should I try again?",
      options: [
        { label: "Try again", text: "keep going" },
        { label: "Stop", text: "stop" },
      ],
    };
  return null;
}

/* ---------- handoffs contract (handoffs-2026-10-30.1) ---------- */

/** What a finished turn brought beyond its reply (only on APIs with the handoffs contract). */
export type TurnExtras = { card?: ApiCard | null; chips?: ApiChip[] };

/** Step events of the contract: `handoff` shows as one quiet line; the other two never show. */
const HANDOFF_STEPS = new Set(["handoff", "handoff_result", "card_read"]);

/** "Asking Collector", or null when Mimi answers herself (no hand-over to show). */
export function handoffLine(s: Pick<ApiStep, "type" | "short">): string | null {
  if (s.type !== "handoff") return null;
  const t = (s.short ?? "").trim();
  if (!t || /^mimi\b/i.test(t)) return null;
  return nairaSign(t);
}

const kobo = (k: number | null | undefined): number | null => (typeof k === "number" && Number.isFinite(k) ? koboToNaira(k) : null);
const nairaText = (k: number | null | undefined, s?: string): string => {
  const n = kobo(k);
  return n !== null ? `₦${n.toLocaleString("en-US")}` : nairaSign(s ?? "");
};

/**
 * An answer card (`shop_row` or `list`) as the answer blocks the console already draws: a shop
 * row reads as stat cards, a list as a table. Every figure is the API's (kobo, read from the book).
 * Unknown kinds give nothing (the reply sentence still shows).
 */
export function cardBlocks(card: ApiCard | null | undefined): AnswerBlock[] {
  if (!card) return [];
  if (card.kind === "shop_row" && card.shop_row) {
    const r = card.shop_row;
    const items = [
      { label: "Owes", value: nairaText(r.owed_kobo, r.owed_naira) },
      { label: "Overdue", value: nairaText(r.overdue_kobo, r.overdue_naira), tone: r.overdue_kobo > 0 ? ("bad" as const) : ("flat" as const) },
      { label: "Days late", value: String(Math.max(0, r.days_late ?? 0)) },
      { label: "Limit", value: nairaText(r.credit_limit_kobo, r.credit_limit_naira) },
    ];
    return [{ type: "stats", items }];
  }
  if (card.kind === "list") {
    if (!card.items?.length) return card.empty_text ? [{ type: "text", text: nairaSign(card.empty_text) }] : [];
    const money = card.items.some((i) => kobo(i.amount_kobo) !== null);
    const qty = card.items.some((i) => typeof i.qty === "number");
    const columns = [{ label: card.title || "Item" }, ...(qty ? [{ label: "Qty", align: "right" as const }] : []), { label: "Status" }, ...(money ? [{ label: "Amount", align: "right" as const }] : [])];
    const rows: TableCell[][] = card.items.slice(0, 8).map((i) => [
      nairaSign(i.label),
      ...(qty ? [typeof i.qty === "number" ? `${i.qty}${i.unit ? ` ${i.unit}` : ""}` : ""] : []),
      nairaSign(i.status || ""),
      ...(money ? [kobo(i.amount_kobo) !== null ? { money: kobo(i.amount_kobo)! } : ""] : []),
    ]);
    const more = card.total > rows.length ? `${rows.length} of ${card.total}` : undefined;
    return [{ type: "table", columns, rows, label: more }];
  }
  return [];
}

/** Next-step chips (two or three, safe tier only): an ask for Mimi or a page to open. Nothing else. */
export function chipReplies(chips: ApiChip[] | null | undefined): Reply[] {
  const out: Reply[] = [];
  for (const c of chips ?? []) {
    if (c.tier !== "safe" || !c.label?.trim()) continue;
    const i = c.intent;
    if (i?.kind === "turn" && i.text?.trim()) out.push({ label: nairaSign(c.label.trim()), text: i.text.trim(), step: "api", assign: i.assign_to || undefined });
    else if (i?.kind === "open" && /^(shop:|order:|approvals$)/.test(i.target ?? "")) out.push({ label: nairaSign(c.label.trim()), step: "api", open: i.target });
    if (out.length === 3) break;
  }
  return out;
}

/**
 * One thread with its messages, the helpers' work steps (folded in before each turn's reply) and
 * its approvals as decision cards. `pending` is a message the owner just sent that the API has not
 * stored yet (kept so the bubble does not blink out while the turn is queued).
 */
export function mapThread(
  d: ApiThreadDetail,
  approvals: ApiApproval[],
  now: number,
  pending: Message[] = [],
  local?: ReadonlyMap<string, Message>,
  /** Handoffs contract: cards and chips of turns this tab followed, by turn id. */
  extras?: ReadonlyMap<string, TurnExtras>,
  /** Zoho records and limit changes undone from this tab (approval or change ids). */
  undone: ReadonlySet<string> = new Set(),
): Conversation {
  const base = mapThreadSummary(d.thread, now);
  const shopName = d.thread.shop_name;
  const helperByTurn = new Map(d.turns.map((t) => [t.turn_id, helperOf(t.helper)]));
  const runningTurns = new Set(d.turns.filter((t) => t.state === "running" || t.state === "queued").map((t) => t.turn_id));
  const stepsByTurn = new Map<string, ApiStep[]>();
  /* handoffs contract: one "Handed to Collector: …" line before the helper's answer (her chat
     then holds the work); its other events never show */
  const askByTurn = new Map<string, string>();
  for (const m of d.messages) if (m.direction === "in" && m.sender === "owner" && m.turn_id && m.text && !askByTurn.has(m.turn_id)) askByTurn.set(m.turn_id, m.text);
  const viaByTurn = new Map<string, string>();
  for (const h of d.handoffs ?? []) viaByTurn.set(h.handoff_id.replace(/^ho_/, ""), h.via);
  const handoffByTurn = new Map<string, Message>();
  for (const s of d.steps) {
    const k = s.turn_id ?? "";
    if (HANDOFF_STEPS.has(s.type)) {
      const line = handoffLine(s);
      const to = k ? helperByTurn.get(k) : undefined;
      if (line && k && to && to !== "Mimi" && !handoffByTurn.has(k))
        handoffByTurn.set(k, {
          id: `api-ho:${s.event_id}`,
          kind: "step",
          from: "Mimi",
          at: parseApiTime(s.at) ?? 0,
          variant: "handoff",
          to,
          state: "done",
          text: handoffText(to, askByTurn.get(k)),
          turn: k,
          via: viaByTurn.get(k),
        });
      continue;
    }
    stepsByTurn.set(k, [...(stepsByTurn.get(k) ?? []), s]);
  }
  const fromOf = (turn: string | null): Roster => {
    const h = turn ? helperByTurn.get(turn) : undefined;
    return h && h !== "Mimi" ? h : base.helper;
  };

  const out: Message[] = [];
  /* each turn's last reply bubble: a card from the handoffs contract joins it */
  const lastReply = new Map<string, number>();
  const emitted = new Set<string>();
  const saidIn = new Map<string, Set<string>>();
  const emitSteps = (turn: string) => {
    if (emitted.has(turn)) return;
    emitted.add(turn);
    const ho = handoffByTurn.get(turn);
    if (ho) out.push(ho);
    const steps = stepsByTurn.get(turn) ?? [];
    if (!steps.length) return;
    /* while the turn runs its steps show one by one; once done they fold into one line */
    if (runningTurns.has(turn)) for (const s of steps) out.push(mapStep(s, fromOf(turn)));
    else out.push(foldSteps(turn, steps, fromOf(turn)));
  };
  /* a shop's (or rep's) own conversation never shows in the console (Tobi, 3 Nov 2026): each of
     its turns is a task in the responsible helper's inbox, so its messages read as task lines */
  const external = d.thread.kind !== "owner";
  const tasked = new Set<string>();
  d.messages.forEach((m, i) => {
    const turn = m.turn_id ?? "";
    if (m.direction === "out" && turn) emitSteps(turn);
    const raw = external ? taskLine(m, fromOf(m.turn_id), shopName, tasked) : mapMessage(m, fromOf(m.turn_id), shopName, local);
    /* each line keeps its turn: the console files it in the chat of the helper who took the turn */
    const mapped = raw && turn && (raw.kind === "text" || raw.kind === "ask") ? { ...raw, turn } : raw;
    /* the same reply stored twice for one turn (a helper's answer and its relay) shows once */
    const twice = mapped?.kind === "text" && m.direction === "out" && turn && saidIn.get(turn)?.has(flatText(mapped.text));
    if (mapped?.kind === "text" && m.direction === "out" && turn) saidIn.set(turn, (saidIn.get(turn) ?? new Set()).add(flatText(mapped.text)));
    if (twice) return;
    if (mapped) out.push(mapped);
    if (mapped?.kind === "text" && m.direction === "out" && turn) lastReply.set(turn, out.length - 1);
    const spoken = external ? null : replyVoice(m, fromOf(m.turn_id));
    if (spoken) out.push(spoken);
    /* a turn with no reply yet: its steps go right after its last inbound message */
    const next = d.messages[i + 1];
    if (turn && m.direction === "in" && (!next || (next.turn_id ?? "") !== turn)) {
      if (!d.messages.some((x) => x.direction === "out" && x.turn_id === turn)) emitSteps(turn);
    }
  });
  for (const turn of stepsByTurn.keys()) if (turn) emitSteps(turn);
  for (const [turn, i] of lastReply) {
    const blocks = cardBlocks(extras?.get(turn)?.card);
    const m = out[i];
    if (!blocks.length || m?.kind !== "text" || m.from === "me") continue;
    out[i] = { id: m.id, kind: "answer", from: m.from, at: m.at, turn, blocks: [{ type: "text", text: m.text, lead: true }, ...blocks] };
  }
  /* chips from the newest turn only, once it has answered */
  const newest = d.turns.at(-1);
  const replies = newest && lastReply.has(newest.turn_id) ? chipReplies(extras?.get(newest.turn_id)?.chips) : [];

  for (const a of approvals) {
    if (a.thread_id !== d.thread.thread_id) continue;
    const card = mapApprovalCard(a, shopName, undone);
    if (!card) continue;
    out.push({ id: `apr:${a.approval_id}`, kind: "card", from: helperOf(a.helper), at: parseApiTime(a.created_at) ?? 0, card, ...(a.turn_id ? { turn: a.turn_id } : {}) });
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
    ...(replies.length ? { replies } : {}),
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

/** How sure a payment is (API proof_grade; the stored proof_level or bank_confirmed on older APIs). */
export function gradeOf(p: { proof_grade?: string; proof_level?: string; bank_confirmed?: boolean }): ProofGrade {
  const g = (p.proof_grade ?? "").toLowerCase();
  if (g === "verified" || g === "estimated" || g === "unverified") return g;
  const l = (p.proof_level ?? "").toLowerCase();
  if (l === "verified") return "verified";
  if (l === "likely") return "estimated";
  if (l === "estimated") return "unverified";
  return p.bank_confirmed ? "verified" : "unverified";
}

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
    amount: p.amount_ngn ?? koboToNaira(p.amount_kobo || p.claimed_kobo),
    verified: gradeOf(p) === "verified",
    proof: gradeOf(p),
  }));
  const live: LiveShopExtra = {
    creditLimit: koboToNaira(s.credit_limit_kobo),
    overdue: s.overdue_ngn ?? koboToNaira(s.overdue_kobo),
    ...(s.overdue_days !== undefined ? { overdueDays: s.overdue_days } : {}),
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

/* ---------- money ---------- */

/**
 * Helpers sometimes write naira as a plain "N" ("N2,387,250", "N50k"). The console always shows
 * the naira sign: an "N" right before a figure, not inside a word, becomes "₦".
 */
/**
 * User-facing text never shows the book's internal keys: Zoho references, fake Zoho ids, payment,
 * delivery and order ids, invoice numbers (they read like database keys to an owner).
 */
const KEYS: [RegExp, string][] = [
  /* "Recorded … in Zoho Books against INV-56-9034." */
  [/\s+against\s+INV-[\w-]+/gi, ""],
  [/\b(?:on|for|of)\s+(?:invoice\s+)?INV-[\w-]+/gi, ""],
  [/\binvoice\s+INV-[\w-]+/gi, "their invoice"],
  [/\bINV-[\w-]+/g, "their invoice"],
  /* the Zoho reference and the fake Zoho id */
  [/\s*\(?\bref(?:erence)?\s*:?\s*mimi-[\w:.-]+\)?/gi, ""],
  [/\bmimi-[a-z_]+:[\w.-]+/gi, ""],
  [/\s*\(?\bzfake_[0-9a-f]+\)?/gi, ""],
  /* book ids in step lines ("the receipt for dlv-56-9034") */
  [/\s+(?:for|to|on)\s+(?:dlv|pay(?:-ss)?|ord|prf)-[\w-]+/gi, ""],
  [/\b(?:dlv|pay-ss|pay|ord|prf)-[\w-]+/gi, ""],
];

export function hideKeys(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [re, to] of KEYS) out = out.replace(re, to);
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
}


export function nairaSign(text: string): string {
  if (!text) return text;
  return text.replace(/(^|[^A-Za-z0-9_₦])N(?=\d)/g, "$1₦");
}

/* ---------- the demo allowance ---------- */

/** Plain words for a shut composer: the demo's allowance is used up, or the demo is paused. */
export function capText(kind: "capped" | "paused", detail = ""): string {
  return kind === "paused" ? friendlyMessage("paused") : friendlyMessage("capped", detail);
}

/** From GET /v1/me: is the composer shut today? Null while there is allowance left. */
export function capFromMe(me: ApiMe | null | undefined): { kind: "capped" | "paused"; text: string } | null {
  const d = me?.demo;
  if (!d) return null;
  if (d.paused) return { kind: "paused", text: capText("paused") };
  if (d.global_cap_kobo > 0 && d.global_spent_kobo >= d.global_cap_kobo) return { kind: "capped", text: capText("capped", "everyone") };
  if (d.ip_cap_kobo > 0 && d.ip_spent_kobo >= d.ip_cap_kobo) return { kind: "capped", text: capText("capped") };
  return null;
}

/* ---------- returns (GET /v1/returns; the contract lives in lib/returns-contract.ts) ---------- */

/** One return as the console shows it. Status words are the API's; nothing is renamed here. */
export function mapReturn(r: ApiReturn): ShopReturn {
  return {
    id: r.return_id,
    shopId: r.shop_id,
    shop: nairaSign(r.shop_name) || "A shop",
    source: r.source,
    reason: nairaSign(r.reason ?? ""),
    status: r.status,
    lines: (r.lines ?? []).map((l) => ({
      item: nairaSign(l.item),
      unit: l.unit ?? "",
      drafted: l.quantity_drafted ?? 0,
      collected: l.quantity_collected ?? 0,
      returned: l.quantity_returned ?? 0,
      reason: nairaSign(l.reason ?? ""),
      condition: l.condition ?? "",
      disposition: l.disposition ?? "",
      ...(l.expires_on ? { expiresOn: l.expires_on } : {}),
      ...(l.expiry_source ? { expirySource: l.expiry_source } : {}),
    })),
    drafted: koboToNaira(r.value_drafted_kobo),
    collected: koboToNaira(r.value_collected_kobo),
    returned: koboToNaira(r.value_returned_kobo),
    credit: koboToNaira(r.credit_kobo),
    creditApplied: koboToNaira(r.credit_applied_kobo),
    creditOnAccount: koboToNaira(r.credit_on_account_kobo),
    steps: (r.transitions ?? []).map((t) => ({ status: t.status, at: t.at, by: t.by ?? "", note: nairaSign(t.note ?? "") })),
    updatedAt: r.updated_at,
  };
}

export const mapReturns = (l: ApiReturnList): ShopReturn[] => (l.returns ?? []).map(mapReturn);

/* ---------- credit exposure (GET /v1/credit/exposure) ---------- */

/**
 * One band's money on a row. The API names each band's field after the band key; when a name does
 * not match, the band shows no figure rather than a made-up nought.
 */
const bandMoney = (row: ApiExposureRow | undefined, key: string): number | null => {
  const buckets = row?.buckets ?? {};
  for (const name of [key, `${key}_kobo`]) if (typeof buckets[name] === "number") return koboToNaira(buckets[name]);
  return null;
};

export function mapExposure(e: ApiExposure): Exposure {
  const bands = (e.buckets ?? []).map((b) => ({
    key: b.key,
    label: b.label,
    /* an open end stays absent: a nought here would print as "0 to 0 days" on the money screen */
    fromDays: b.from_days ?? null,
    toDays: b.to_days ?? null,
    weightPct: b.weight_pct ?? 0,
  }));
  const money = (r: ApiExposureRow) => ({
    owed: koboToNaira(r.outstanding_kobo),
    overdue: koboToNaira(r.overdue_kobo),
    oldest: r.oldest_days_overdue ?? 0,
    openInvoices: r.open_invoices ?? 0,
    band: Object.fromEntries(bands.map((b) => [b.key, bandMoney(r, b.key)])),
    weighted: koboToNaira(r.exposure_kobo),
    verified: koboToNaira(r.verified_paid_kobo),
    shownNotCounted: koboToNaira(r.shown_not_counted_kobo),
    ...(r.confidence ? { confidence: r.confidence } : {}),
    ...(r.note ? { note: nairaSign(r.note) } : {}),
  });
  const shops: ExposureShop[] = (e.shops ?? []).map((s) => ({
    id: s.shop_id ?? "",
    name: nairaSign(s.shop_name ?? "") || "A shop",
    ...money(s),
  }));
  return {
    asOf: e.as_of ?? "",
    ...(e.policy_version ? { policyVersion: e.policy_version } : {}),
    bands,
    shops,
    total: money(e.total),
  };
}

/* ---------- the returns credit (kind "return_credit" on GET /v1/approvals) ---------- */

/**
 * "Credit ₦34,950 to Mama Chidi": the same card as the Zoho record, because it is the same kind of
 * decision. Approving applies the credit to the oldest invoices first; the API fills `result`, and
 * the Undo button follows `result.undo_available`, never this code's assumption.
 */
export function returnCreditCard(
  a: ApiApproval,
  status: CardStatus,
  opts: { undo?: DecisionCard["undo"]; sentAt?: string } = {},
): DecisionCard {
  const p = (a.payload ?? {}) as Record<string, unknown>;
  const amount = koboToNaira(num(p.amount_kobo)) || Math.round(num(p.amount_ngn));
  const shop = nairaSign(str(p.shop_name)) || "A shop";
  const applied = koboToNaira(num(p.applied_kobo));
  const onAccount = koboToNaira(num(p.on_account_kobo));
  const r = a.result ?? null;
  const appliedNow = koboToNaira(num(r?.applied_kobo)) || applied;
  const onAccountNow = koboToNaira(num(r?.on_account_kobo)) || onAccount;
  /* the invoice numbers are the book's keys: the owner reads the shop and the ₦, never a key */
  const invoices = Array.isArray(p.invoices) ? (p.invoices as Array<Record<string, unknown>>) : [];
  const rows = invoices
    .map((inv) => ({ label: "Against their oldest open invoice", amount: koboToNaira(num(inv.amount_applied_kobo)) }))
    .filter((x) => x.amount > 0)
    .slice(0, 4);
  const heldOnly = appliedNow === 0 && onAccountNow > 0;
  return {
    kind: "return",
    tier: "Approve",
    shop,
    amount,
    why: "Goods came back",
    title: `Credit ${naira(amount)} to ${shop}`,
    sub:
      status === "needs"
        ? "The depot checked what came back. Nothing is credited to the shop until you approve."
        : "Goods that came back",
    rows: [
      /* the invoice rows above drop noughts; so must the fallback, or the card would claim
         "Against their oldest open invoice ₦0" beside "Held on the account ₦12,000" */
      ...(rows.length || appliedNow === 0 ? rows : [{ label: "Against their oldest open invoice", amount: appliedNow, note: undefined }]),
      ...(onAccountNow > 0 ? [{ label: "Held on the account", amount: onAccountNow, note: "Nothing to set it against" }] : []),
    ],
    reasons: str(p.reason) ? [nairaSign(str(p.reason))] : undefined,
    noTotal: true,
    primary: "Approve credit",
    secondary: "Decline",
    labels: { primary: "Approve credit", secondary: "Not now" },
    status,
    sentAt: opts.sentAt,
    doneText: heldOnly ? "Held on the account" : "Credit applied",
    declinedText: "Not credited",
    undo: opts.undo,
  };
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
      return "Mimi can't be reached right now.";
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
