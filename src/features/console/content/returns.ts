import type { IconName } from "@/features/console/components/ui/icon-paths";

/**
 * Returns, as the console reads them. The API's status words are frozen (see
 * `lib/returns-contract.ts`): drafted, approved, collected, inspected, settled, cancelled. This file
 * only turns them into words and colours a person reads; it never invents a step.
 */
export const returnStatuses = ["drafted", "approved", "collected", "inspected", "settled", "cancelled"] as const;
export type ReturnStatus = (typeof returnStatuses)[number];

type Look = { label: string; tone: "neutral" | "sand" | "green"; icon: IconName };

export const returnStatusView: Record<ReturnStatus, Look> = {
  drafted: { label: "Drafted", tone: "neutral", icon: "pen" },
  approved: { label: "Agreed", tone: "neutral", icon: "hand" },
  collected: { label: "Collected", tone: "sand", icon: "package" },
  inspected: { label: "Checked", tone: "sand", icon: "list-checks" },
  settled: { label: "Credited", tone: "green", icon: "circle-check" },
  cancelled: { label: "Cancelled", tone: "neutral", icon: "circle-x" },
};

/** The look of a status word. An unknown word is shown as it came, in neutral grey. */
export function statusView(status: string): Look {
  return returnStatusView[status as ReturnStatus] ?? { label: status, tone: "neutral", icon: "circle-dashed" };
}

export const conditionWords: Record<string, string> = {
  resellable: "Resellable",
  damaged: "Damaged",
  expired: "Expired",
};

export const dispositionWords: Record<string, string> = {
  resell: "Back on the shelf",
  write_off: "Written off",
  return_to_supplier: "Back to the supplier",
};

export type ReturnLine = {
  item: string;
  unit: string;
  /** What the shop said at the start. */
  drafted: number;
  /** What the rep actually picked up. */
  collected: number;
  /** What the depot counted as coming back. */
  returned: number;
  reason: string;
  condition: string;
  disposition: string;
  expiresOn?: string;
  /** "invoice" is a fact off the distributor's invoice; "estimated" is our guess. */
  expirySource?: string;
};

export type ReturnStep = { status: string; at: string; by: string; note: string };

export type ShopReturn = {
  id: string;
  shopId: string;
  shop: string;
  source: string;
  reason: string;
  /** One of the API's words; kept as it came so an unknown one is never renamed here. */
  status: string;
  lines: ReturnLine[];
  drafted: number;
  collected: number;
  returned: number;
  /** The credit that closes it, once the owner approves it. */
  credit: number;
  creditApplied: number;
  creditOnAccount: number;
  steps: ReturnStep[];
  updatedAt: string;
};

/** Still moving: everything except the two that end it. */
export const isOpenReturn = (r: ShopReturn): boolean => r.status !== "settled" && r.status !== "cancelled";

/**
 * Who did a step, when the API sends a word a person should read. Anything that looks like an
 * internal key (rep-1, shop-001) is dropped rather than shown.
 */
export function personOf(by: string): string {
  const s = (by ?? "").trim();
  return /^[A-Za-z][A-Za-z ]{1,24}$/.test(s) ? s : "";
}

/** How much of what was drafted actually came back, 0 to 100. */
export const returnedPct = (r: ShopReturn): number => (r.drafted > 0 ? Math.round((r.returned / r.drafted) * 100) : 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A day from the API's ISO stamp, read in Lagos (UTC+1 all year, like mappers.clockLabel). */
export function dayOf(iso: string): string {
  const t = Date.parse(iso ?? "");
  if (Number.isNaN(t)) return "";
  const d = new Date(t + 60 * 60_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** Whatever came back out of what was drafted, in plain words. */
export function cameBack(r: ShopReturn): string {
  if (r.drafted === 0) return "Nothing drafted";
  const pct = returnedPct(r);
  return r.returned === r.drafted ? "All of it" : `${pct}% of it`;
}
