import type { HelperName } from "@/features/console/demo/types";

/** Where an automation reads from or writes to (icons on templates and rows). */
export type Channel = "whatsapp" | "bank" | "email" | "sheet";
export const channelName: Record<Channel, string> = { whatsapp: "WhatsApp", bank: "Bank", email: "Email", sheet: "Sheet" };

export const autoEvents = [
  { id: "bank-alert", label: "A bank alert lands", short: "bank alert lands" },
  { id: "delivery", label: "A delivery is logged", short: "delivery logged" },
  { id: "stock-low", label: "Stock falls below a level", short: "stock below level" },
  { id: "quiet", label: "A shop goes quiet for some days", short: "shop goes quiet" },
  { id: "promise", label: "A promise-to-pay date is reached", short: "promise date reached" },
  { id: "price", label: "A supplier changes a price", short: "price changes" },
] as const;
export type AutoEvent = (typeof autoEvents)[number]["id"];

export type AutoTrigger =
  | { kind: "schedule"; days: string[]; time: string; monthly?: "first" | "last" }
  | { kind: "event"; event: AutoEvent; value?: number };

export type ShopScope = { mode: "all" | "area" | "list" | "tag"; area?: string; shops?: string[]; tag?: string };

export const resultPlaces = ["Console thread", "WhatsApp to owner", "Email"] as const;
export type ResultPlace = (typeof resultPlaces)[number];

export type AutoRun = {
  id: string;
  /** "Mon 20 Oct · 8:00" */
  at: string;
  status: "done" | "needs" | "failed" | "run";
  summary: string;
  /** The thread this run created. */
  thread?: string;
};

export type Automation = {
  id: string;
  title: string;
  description: string;
  helper: HelperName;
  trigger: AutoTrigger;
  scope: ShopScope;
  channels: Channel[];
  instructions: string;
  approval: boolean;
  quiet: string;
  maxPerWeek: number;
  lands: ResultPlace;
  shared?: boolean;
  /** Made in this demo session (lives at /console/automations/view?id=). */
  created?: boolean;
  runs: AutoRun[];
};

export type AutoTemplate = {
  id: string;
  title: string;
  description: string;
  helper: HelperName;
  channels: Channel[];
  trigger: AutoTrigger;
  scope: ShopScope;
  lands: ResultPlace;
  instructions: string;
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const dayName: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
export const shopTags = ["Late payers", "POS payers", "New shops", "Wholesale", "Credit customers"] as const;
export const AREAS = ["Oshodi", "Mushin", "Ikeja"] as const;

const clock12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const hh = (h ?? 0) % 12 || 12;
  return `${hh}${m ? `:${String(m).padStart(2, "0")}` : ""}${(h ?? 0) < 12 ? "am" : "pm"}`;
};

/** "Every Monday 8am", "Weekdays 6pm", "Every day 8:30am". */
export function scheduleLabel(days: string[], time: string): string {
  const set = new Set(days);
  const when =
    set.size === 7 ? "Every day" : set.size === 5 && !set.has("Sat") && !set.has("Sun") ? "Weekdays" : set.size === 1 ? `Every ${dayName[days[0]!]}` : DAYS.filter((d) => set.has(d)).join(", ");
  return `${when} ${clock12(time)}`;
}

export function triggerLabel(t: AutoTrigger): string {
  if (t.kind === "schedule" && t.monthly) return `${t.monthly === "first" ? "1st" : "Last day"} of the month ${clock12(t.time)}`;
  if (t.kind === "schedule") return scheduleLabel(t.days, t.time);
  const e = autoEvents.find((x) => x.id === t.event)!;
  if (t.event === "stock-low") return `Stock below ${t.value ?? 20} cartons`;
  if (t.event === "quiet") return `Shop quiet ${t.value ?? 10} days`;
  return e.label.replace(/^A /, "");
}

export function scopeLabel(s: ShopScope, total = 48): string {
  if (s.mode === "all") return `All ${total} shops`;
  if (s.mode === "area") return `${s.area ?? "Oshodi"} shops`;
  if (s.mode === "tag") return `Tagged ${s.tag ?? "Late payers"}`;
  const n = s.shops?.length ?? 0;
  return `${n} shop${n === 1 ? "" : "s"}`;
}

const GUARD = "\n\n## Never\n- Move money or promise discounts.\n- Message a shop that already paid (check the bank first).";

export const templates: readonly AutoTemplate[] = [
  {
    id: "monday-chase",
    title: "Monday debt chase",
    description: "Every Monday, check the bank, then draft polite reminders for every shop over ₦50k. Firm past a week.",
    helper: "Collector",
    channels: ["bank", "whatsapp"],
    trigger: { kind: "schedule", days: ["Mon"], time: "08:00" },
    scope: { mode: "all" },
    lands: "WhatsApp to owner",
    instructions:
      "Chase every shop that owes more than **₦50,000**.\n\n1. Check GTBank first and drop anyone who already paid.\n2. Firm for shops 7+ days late, Soft for the rest.\n3. Draft one WhatsApp reminder per shop and send me the plan to approve." + GUARD,
  },
  {
    id: "brand-sellout",
    title: "Weekly sell-out report to brand",
    description: "Pull the week's sell-out by area and draft the report for the brand's area manager.",
    helper: "Brand",
    channels: ["sheet", "email"],
    trigger: { kind: "schedule", days: ["Mon"], time: "09:00" },
    scope: { mode: "all" },
    lands: "Console thread",
    instructions: "Pull last week's sell-out from every shop, grouped by area, with the change on the week before.\n\nLeave the report in Docs as a draft and ask me before it goes to the brand." + GUARD,
  },
  {
    id: "low-stock",
    title: "Low stock reorder plan",
    description: "When a product drops below a week of stock, draft a reorder from the supplier for you to approve.",
    helper: "Stock",
    channels: ["sheet", "whatsapp"],
    trigger: { kind: "event", event: "stock-low", value: 20 },
    scope: { mode: "all" },
    lands: "WhatsApp to owner",
    instructions: "When any product has less than a week left at the current pace, draft a restock from the usual supplier.\n\nShow how many cartons, the cost and the day it runs out. Nothing is ordered until I approve." + GUARD,
  },
  {
    id: "check-alerts",
    title: "Check every transfer alert",
    description: "Each time a shop sends a transfer alert, match it to the bank. Flag fakes and hold their next order.",
    helper: "Proof",
    channels: ["bank", "whatsapp"],
    trigger: { kind: "event", event: "bank-alert" },
    scope: { mode: "all" },
    lands: "Console thread",
    instructions: "Match every transfer alert or POS slip a shop sends to the GTBank statement.\n\n- Landed: mark **Verified**.\n- Not landed after 2 hours: mark **Self-reported** and check again.\n- No money at all: flag it and ask me to hold their orders." + GUARD,
  },
  {
    id: "credit-review",
    title: "Credit limit review monthly",
    description: "On the 1st, look at how every credit shop paid and suggest limit changes with reasons.",
    helper: "Credit",
    channels: ["bank", "sheet"],
    trigger: { kind: "schedule", days: [], time: "10:00", monthly: "first" },
    scope: { mode: "tag", tag: "Credit customers" },
    lands: "Console thread",
    instructions: "Review every credit customer's last 4 weeks: how fast they paid and how often they hit the limit.\n\nSuggest raises only for shops that paid on time every week, and cuts for shops 14+ days late. I approve each change." + GUARD,
  },
  {
    id: "quiet-reorder",
    title: "Reorder reminder for quiet shops",
    description: "When a shop hasn't ordered for a while, draft a friendly check-in with their usual order.",
    helper: "Order",
    channels: ["whatsapp"],
    trigger: { kind: "event", event: "quiet", value: 10 },
    scope: { mode: "all" },
    lands: "WhatsApp to owner",
    instructions: "When a shop hasn't ordered in 10 days, draft a short check-in that mentions their usual order and the next van day.\n\nNo discounts. Ask me before sending." + GUARD,
  },
  {
    id: "delivery-proof",
    title: "Delivery proof follow-up",
    description: "After each delivery, ask the driver for a photo of the signed waybill and file it with the invoice.",
    helper: "Proof",
    channels: ["whatsapp", "sheet"],
    trigger: { kind: "event", event: "delivery" },
    scope: { mode: "all" },
    lands: "Console thread",
    instructions: "When a delivery is logged, ask the driver on WhatsApp for a photo of the signed waybill.\n\nFile it with the invoice. If nothing comes in 3 hours, tell me." + GUARD,
  },
  {
    id: "promise-follow",
    title: "Promised-to-pay follow-up",
    description: "On the day a shop promised to pay, check the bank first, then remind them only if nothing landed.",
    helper: "Collector",
    channels: ["bank", "whatsapp"],
    trigger: { kind: "event", event: "promise" },
    scope: { mode: "tag", tag: "Late payers" },
    lands: "WhatsApp to owner",
    instructions: "On the promise date, check GTBank at 10am.\n\n- Paid: thank them and close it.\n- Not paid: draft a polite reminder that mentions the promise. I approve before it goes." + GUARD,
  },
  {
    id: "new-shop-welcome",
    title: "New shop welcome after delivery",
    description: "After a new shop's first delivery, send a welcome with how to pay and who to call.",
    helper: "Order",
    channels: ["whatsapp"],
    trigger: { kind: "event", event: "delivery" },
    scope: { mode: "tag", tag: "New shops" },
    lands: "WhatsApp to owner",
    instructions: "After a new shop's first delivery, draft a short welcome: the account to pay into, the van days, and the sales rep's number.\n\nAsk me before sending." + GUARD,
  },
  {
    id: "eod-cash",
    title: "End-of-day cash summary",
    description: "Every evening, total what landed in the bank today, by shop, and what is still owed.",
    helper: "Proof",
    channels: ["bank", "whatsapp"],
    trigger: { kind: "schedule", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], time: "18:00" },
    scope: { mode: "all" },
    lands: "WhatsApp to owner",
    instructions: "At 6pm, total every credit that landed in GTBank today, matched to shops, and list what is still owed over ₦50,000.\n\nSend it to me only. Nothing goes to shops." + GUARD,
  },
  {
    id: "month-statement",
    title: "Month-end statement to shops",
    description: "On the last day of the month, draft each shop's statement: invoices, payments and balance.",
    helper: "Collector",
    channels: ["sheet", "whatsapp", "email"],
    trigger: { kind: "schedule", days: [], time: "16:00", monthly: "last" },
    scope: { mode: "tag", tag: "Credit customers" },
    lands: "Console thread",
    instructions: "Draft a statement for every credit shop: this month's invoices, payments that landed and the balance.\n\nAttach it as a PDF. I approve the batch before any go out." + GUARD,
  },
  {
    id: "price-notice",
    title: "Price change notice to shops",
    description: "When a supplier changes a price, draft a short notice to the shops that buy that product.",
    helper: "Brand",
    channels: ["email", "whatsapp"],
    trigger: { kind: "event", event: "price" },
    scope: { mode: "all" },
    lands: "WhatsApp to owner",
    instructions: "When a supplier price changes, draft a short notice to every shop that bought that product in the last month: old price, new price, and the date it starts.\n\nAsk me before sending." + GUARD,
  },
];

/** The existing automations, now with triggers, scopes and run history (runs link to their threads). */
export const seedAutomationsList = (): Automation[] => [
  {
    id: "morning-chase",
    title: "Morning chase",
    description: "Each weekday at 8am, nudges shops that promised to pay and haven't. Asks you first.",
    helper: "Collector",
    trigger: { kind: "schedule", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], time: "08:00" },
    scope: { mode: "tag", tag: "Late payers" },
    channels: ["bank", "whatsapp"],
    instructions: templates[7]!.instructions,
    approval: true,
    quiet: "9pm to 7am",
    maxPerWeek: 3,
    lands: "Console thread",
    runs: [{ id: "r1", at: "Fri 23 Oct · 8:52", status: "done", summary: "Created from the chase thread · first run Monday", thread: "chase-over-50k" }],
  },
  {
    id: "credit-review",
    title: "Monthly credit review",
    description: "First Monday of the month, suggests limit changes from verified payments only.",
    helper: "Credit",
    trigger: { kind: "schedule", days: ["Mon"], time: "09:00", monthly: "first" },
    scope: { mode: "all" },
    channels: ["bank", "sheet"],
    instructions: templates[4]!.instructions,
    approval: true,
    quiet: "None",
    maxPerWeek: 1,
    lands: "Console thread",
    runs: [
      { id: "r1", at: "Mon 5 Oct · 9:00", status: "done", summary: "3 limits raised, 1 lowered · all approved" },
      { id: "r2", at: "Mon 7 Sep · 9:00", status: "done", summary: "2 limits raised" },
    ],
  },
  {
    id: "quiet-reorder",
    title: "Quiet shop reorder",
    description: "When a good shop hasn't ordered for 10 days, drafts their usual order for you.",
    helper: "Order",
    trigger: { kind: "event", event: "quiet", value: 10 },
    scope: { mode: "all" },
    channels: ["whatsapp", "sheet"],
    instructions: templates[5]!.instructions,
    approval: true,
    quiet: "9pm to 7am",
    maxPerWeek: 2,
    lands: "Console thread",
    runs: [{ id: "r1", at: "Wed 21 Oct · 11:10", status: "done", summary: "Drafted Mama Bisi's usual 25 cartons · approved" }],
  },
  {
    id: "morning-alerts",
    title: "Morning alert check",
    description: "Matches overnight transfer alerts to GTB and holds orders on fake ones.",
    helper: "Proof",
    trigger: { kind: "schedule", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], time: "08:30" },
    scope: { mode: "all" },
    channels: ["bank", "whatsapp"],
    instructions: templates[3]!.instructions,
    approval: true,
    quiet: "9pm to 7am",
    maxPerWeek: 2,
    lands: "Console thread",
    shared: true,
    runs: [
      { id: "r1", at: "Fri 23 Oct · 8:30", status: "needs", summary: "1 fake alert: Kola Mart ₦120,000", thread: "kola-mart-alert" },
      { id: "r2", at: "Thu 22 Oct · 8:30", status: "done", summary: "4 alerts matched · all verified" },
      { id: "r3", at: "Wed 21 Oct · 8:30", status: "done", summary: "2 alerts matched · all verified" },
    ],
  },
  {
    id: "friday-reminders",
    title: "Friday payment reminders",
    description: "Drafts reminders for shops more than a week late. Asks you first.",
    helper: "Collector",
    trigger: { kind: "schedule", days: ["Fri"], time: "10:00" },
    scope: { mode: "all" },
    channels: ["bank", "whatsapp"],
    instructions: templates[0]!.instructions,
    approval: true,
    quiet: "9pm to 7am",
    maxPerWeek: 2,
    lands: "WhatsApp to owner",
    runs: [
      { id: "r1", at: "Fri 23 Oct · 8:41", status: "needs", summary: "Plan for 5 shops · ₦385,900 · waiting on you", thread: "chase-over-50k" },
      { id: "r2", at: "Thu 22 Oct · 9:00", status: "done", summary: "Chuks & Sons promised Friday", thread: "chuks-friday" },
      { id: "r3", at: "Fri 16 Oct · 10:00", status: "failed", summary: "GTBank timed out · retried at 10:05 and finished" },
      { id: "r4", at: "Fri 9 Oct · 10:00", status: "done", summary: "4 reminders sent · ₦212,000 recovered" },
    ],
  },
  {
    id: "low-stock",
    title: "Low stock warning",
    description: "Warns you a week before any product runs out in the warehouse.",
    helper: "Stock",
    trigger: { kind: "schedule", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], time: "18:00" },
    scope: { mode: "all" },
    channels: ["sheet", "whatsapp"],
    instructions: templates[2]!.instructions,
    approval: true,
    quiet: "9pm to 7am",
    maxPerWeek: 1,
    lands: "WhatsApp to owner",
    shared: true,
    runs: [
      { id: "r1", at: "Thu 22 Oct · 18:00", status: "needs", summary: "Indomie runs out Thursday · restock drafted", thread: "indomie-low" },
      { id: "r2", at: "Wed 21 Oct · 18:00", status: "done", summary: "Nothing low" },
    ],
  },
  {
    id: "brand-report",
    title: "Hypo weekly sell-out report",
    description: "Writes the report by area and leaves it in Docs as a draft.",
    helper: "Brand",
    trigger: { kind: "schedule", days: ["Mon"], time: "09:00" },
    scope: { mode: "all" },
    channels: ["sheet", "email"],
    instructions: templates[1]!.instructions,
    approval: true,
    quiet: "None",
    maxPerWeek: 1,
    lands: "Console thread",
    runs: [
      { id: "r1", at: "Mon 19 Oct · 9:00", status: "needs", summary: "Report ready in Docs · send to Hypo?", thread: "hypo-weekly" },
      { id: "r2", at: "Mon 12 Oct · 9:00", status: "done", summary: "Sent to Hypo with the PDF" },
    ],
  },
];
