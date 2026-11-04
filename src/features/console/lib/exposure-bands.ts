import type { ExposureBand } from "@/features/console/content/exposure";

/**
 * One ageing band, in words.
 *
 * The API sends `null` for an open end of a band: the current band has no lower bound (nothing is
 * owed yet) and the oldest band has no upper one. A nought in either place is not the same fact:
 * it printed as "0 to 0 days" on the money screen and read like a broken range, so an absent bound
 * is now stated in words or left out (Tobi, 4 Nov 2026).
 *
 * Pure, and the only place a band's range is spelled: the row label comes from the band's own name,
 * so nothing here can contradict it.
 */
export function bandRange(fromDays: number | null, toDays: number | null): string | null {
  /* no lower bound and no upper bound: there is no range to state */
  if (fromDays === null && toDays === null) return null;
  /* the current band ("Not yet due"): its own name already says it, and a range would be a nought */
  if (fromDays === null) return toDays !== null && toDays > 0 ? `up to ${toDays} days` : null;
  /* the oldest band ("Over 60 days"): from its lower bound upward */
  if (toDays === null) return `${fromDays} days and over`;
  return `${fromDays} to ${toDays} days`;
}

/** A band's second line: its range when it has one, and always the weight it carries. */
export function bandSubline(band: Pick<ExposureBand, "fromDays" | "toDays" | "weightPct">): string {
  const range = bandRange(band.fromDays, band.toDays);
  return range ? `${range} · weighted at ${band.weightPct}%` : `weighted at ${band.weightPct}%`;
}
