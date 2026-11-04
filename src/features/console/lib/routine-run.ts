import type { Routine } from "@/features/console/content/routines";

/**
 * What a "Run now" answer means, in one place, so a refusal can never be shown as a run that
 * happened. A run counts as started only when the API answered with the routine's own row (read by
 * `readRunRow`); the API's own refusal sentence is shown as written; anything else is "not started".
 */
export type RoutineRunOutcome =
  | { started: true; note?: undefined; missing?: undefined }
  | { started: false; note: string; missing?: boolean };

/** What the row says when a run could not be started and the API sent no sentence of its own. */
export const RUN_FAILED = "Mimi couldn't start that routine just now.";

/** The outcome of one attempt: the API's row means started; its sentence means refused; else not started. */
export function runOutcome(p: { row: Routine | null; detail?: string; missing?: boolean }): RoutineRunOutcome {
  if (p.row) return { started: true };
  if (p.missing) return { started: false, note: "", missing: true };
  return { started: false, note: p.detail?.trim() || RUN_FAILED };
}

/**
 * Which answers are the API refusing a run, in its own words, and which are our own failure to
 * report. The route refuses two ways: 409 with its sentence (already ran today, or paused), and 404
 * "unknown routine" for a routine the API does not have. Anything else is not a refusal: a 401
 * ("Missing bearer"), a 5xx or a dropped connection is a fault to report, and its machine wording is
 * never printed on the row as if the API had refused the owner in a sentence.
 */
export function refusalWords(status: number, detail: string): string {
  return status === 409 || status === 404 ? detail.trim() : "";
}
