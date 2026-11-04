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
