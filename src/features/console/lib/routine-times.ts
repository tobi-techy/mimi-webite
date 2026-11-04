import type { Routine } from "@/features/console/content/routines";

/**
 * Routine times in words, in Lagos (Tobi, 4 Nov 2026). The API sends the schedule as a sentence and
 * the two times as ISO instants, so the console words the times itself rather than re-reading a
 * server sentence for them. Africa/Lagos is the product's one zone (MIMI-AGENT `mimi/tz.py`).
 */
const TZ = "Africa/Lagos";

const clock = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
const day = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short" });
/** The calendar day of an instant in Lagos, for telling today from yesterday without doing sums. */
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const DAY_MS = 86_400_000;

const at = (n: number) => `${clock.format(n)}`;
const sameDay = (a: number, b: number) => dayKey.format(a) === dayKey.format(b);

/** "today at 8:00 AM" · "yesterday at 6:00 PM" · "3 Nov at 8:00 AM". Lower case, so it sits in a sentence. */
export function timeWords(when: number, now: number): string {
  if (sameDay(when, now)) return `today at ${at(when)}`;
  if (sameDay(when, now - DAY_MS)) return `yesterday at ${at(when)}`;
  return `${day.format(when)} at ${at(when)}`;
}

/** "tomorrow at 8:00 AM", else the same words as `timeWords`. */
export function nextTimeWords(when: number, now: number): string {
  if (sameDay(when, now + DAY_MS)) return `tomorrow at ${at(when)}`;
  return timeWords(when, now);
}

/** When a routine last ran: "Last ran today at 8:00 AM", or "Not run yet". */
export function lastRunWords(r: Routine, now: number): string {
  return r.lastRunAt > 0 ? `Last ran ${timeWords(r.lastRunAt, now)}` : "Not run yet";
}

/** When it runs next: "Next run tomorrow at 8:00 AM". "" when the API sent no next run. */
export function nextRunWords(r: Routine, now: number): string {
  return r.nextRunAt > 0 ? `Next run ${nextTimeWords(r.nextRunAt, now)}` : "";
}

/** A routine's second line: its schedule, when it last ran, and when it runs next. */
export function routineLine(r: Routine, now: number): string {
  return [r.schedule, lastRunWords(r, now), nextRunWords(r, now)].filter(Boolean).join(" · ");
}

/** When the API read both books: "Read today at 9:04 AM". "" when it sent no time. */
export function readWords(asOf: string, parseTime: (s: string) => number | null, now: number): string {
  const t = parseTime(asOf);
  return t === null ? "" : `Read ${timeWords(t, now)}`;
}
