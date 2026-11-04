/**
 * Routines, as the console reads them: the work Mimi does on her own, and when. The API owns the
 * words (`name`, `schedule`, `paused_reason`, `last_finding`); this file only says what the row
 * looks like. Times are worded in lib/routine-times.ts, in Lagos.
 */
export type Routine = {
  /** Machine id: the row's key, and what a pause or resume names. Never shown to a person. */
  id: string;
  /** In words, written by code: "Morning briefing". */
  name: string;
  /** The schedule in words: "Every day at 8:00 AM". */
  schedule: string;
  paused: boolean;
  /** Why it is paused, in words, when the API sends it. */
  pausedReason: string;
  /**
   * When it last ran, and when it runs next, as epoch ms. 0 is "no such time": it has never run, or
   * the API sent no next run. A time the API sent that cannot be read is also 0, never "now".
   */
  lastRunAt: number;
  nextRunAt: number;
  /** What it found last time, in one line. "" when it had nothing to say. */
  finding: string;
  /**
   * The shop that finding is about, when it is about one shop. The finding then opens that shop.
   * "" means the finding is about no single shop (or names several), so it stays plain text: the
   * console never guesses a link out of a sentence. Machine id: never rendered.
   */
  findingShopId: string;
};

export type RoutineLook = { label: string; tone: "green" | "amber" | "muted" };

/**
 * The list as the rail reads it: the rows, and when the API read them. The as-of time goes on
 * screen, because "last ran at 8:00" without a date invites the same argument a reconciliation
 * figure without a date does.
 */
export type RoutineList = {
  /** When the API read the list, ISO with zone. "" when it sent none. */
  asOf: string;
  routines: Routine[];
};

/** The pill on a routine's row: the API's own paused switch, in two words. */
export function routineLook(r: Routine): RoutineLook {
  return r.paused ? { label: "Paused", tone: "amber" } : { label: "On schedule", tone: "green" };
}

/** The one control on the row: it says what it will do, not the state it is in. */
export function routineAction(r: Routine): "Pause" | "Resume" {
  return r.paused ? "Resume" : "Pause";
}
