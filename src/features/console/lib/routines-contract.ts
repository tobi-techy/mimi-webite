/**
 * Routines, the moment the API grows them (owner-approved shape, 4 Nov 2026: the scheduler agent
 * implements exactly this, so the console is not reading a shape it guessed at).
 *
 * One place to change. Until the route lands the console shows the honest "not available yet" note
 * on /routines and never invents a row.
 *
 * `GET /v1/routines` (owner key):
 * ```json
 * {
 *   "routines": [
 *     {
 *       "id": "morning_brief",
 *       "name": "Morning briefing",
 *       "schedule": "Every day at 8:00 AM",
 *       "paused": false,
 *       "paused_reason": "",
 *       "last_run_at": "2026-11-04T08:00:12+01:00",
 *       "next_run_at": "2026-11-05T08:00:00+01:00",
 *       "last_finding": "3 shops are past 60 days, ₦1,240,000 between them."
 *     }
 *   ],
 *   "as_of": "2026-11-04T09:00:00+01:00"
 * }
 * ```
 * `name`, `schedule`, `paused_reason` and `last_finding` are sentences written by code, rendered as
 * written; `id` is machine data and is never shown. `last_run_at` and `next_run_at` are ISO 8601 with
 * a zone, "" when a routine has never run, and the console words them itself in Lagos.
 *
 * `POST /v1/routines/{id}/pause` and `POST /v1/routines/{id}/resume` (owner key), each answering
 * `{ "id": "morning_brief", "name": "Morning briefing", "paused": true }`.
 */
export const ROUTINES_PATH = "/v1/routines";
export const routinePausePath = (id: string): string => `${ROUTINES_PATH}/${encodeURIComponent(id)}/pause`;
export const routineResumePath = (id: string): string => `${ROUTINES_PATH}/${encodeURIComponent(id)}/resume`;
