import type { Status } from "@/features/console/components/ui/StatusPill";

/**
 * How sure a payment is, in the demo's three plain words (API `proof_grade`). The stored
 * `proof_level` (verified, likely, estimated) maps onto it; older APIs only say bank_confirmed.
 */
export type ProofGrade = "verified" | "estimated" | "unverified";

export const proofWords: Record<ProofGrade, string> = {
  verified: "Confirmed by bank",
  estimated: "Likely",
  unverified: "Not checked",
};

/** The quiet tinted text each grade uses (green, sand, grey). */
export const proofStatus: Record<ProofGrade, Status> = { verified: "verified", estimated: "partial", unverified: "self" };
