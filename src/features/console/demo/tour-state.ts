import type { Conversation } from "@/features/console/demo/types";

/**
 * The demo tour's one conversation (a task in Mimi's chat), held here so the live demo can lay it
 * over the API's threads on every poll. No imports beyond types: the API sync reads it.
 */
export const TOUR_SLUG = "demo-tour";

let tour: Conversation | null = null;

export const tourConversation = (): Conversation | null => tour;
export const setTourConversation = (c: Conversation | null): void => {
  tour = c;
};

/* What the API echoes of the tour into the owner thread (hidden, see lib/tour-echo.ts) */
let baseline: Set<string> | null = null;
let wantBaseline = false;
const approvals = new Set<string>();

/** A new run: forget the last run's cards and read the owner thread's messages afresh on the next publish. */
export function resetTourEcho(): void {
  baseline = null;
  wantBaseline = true;
  approvals.clear();
}
/** An approval behind one of the tour's own cards (its API card stays hidden). */
export const ownTourApproval = (id: string): void => void approvals.add(id);

/** The sync calls this with the owner thread's message ids on every publish; the first after a reset is the baseline. */
export function tourEcho(ownerIds: () => string[]): {
  active: boolean;
  baseline: ReadonlySet<string> | null;
  approvals: ReadonlySet<string>;
} {
  if (wantBaseline) {
    baseline = new Set(ownerIds());
    wantBaseline = false;
  }
  return { active: !!tour && (tour.state !== "done" || !!tour.replies?.length), baseline, approvals };
}
