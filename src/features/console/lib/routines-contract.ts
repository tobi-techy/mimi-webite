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
 *       "last_finding": "3 shops are past 60 days, ₦1,240,000 between them.",
 *       "last_finding_shop_id": ""
 *     }
 *   ],
 *   "as_of": "2026-11-04T09:00:00+01:00"
 * }
 * ```
 * `name`, `schedule`, `paused_reason` and `last_finding` are sentences written by code, rendered as
 * written; `id` is machine data and is never shown. `last_run_at` and `next_run_at` are ISO 8601 with
 * a zone, "" when a routine has never run, and the console words them itself in Lagos. `as_of` is
 * shown too ("Read today at 9:00 AM"): a row that says when it last ran needs the date it was read.
 *
 * `last_finding_shop_id` is the one new field the console asks for: the shop the last finding is
 * about, when it is about exactly one shop. The console then opens that shop from the finding's line
 * (`/shops/live?id=…`, which the static export serves). It is never rendered, and "" or absent leaves
 * the finding as plain text, because the console will not guess a link out of a sentence.
 *
 * `POST /v1/routines/{id}/pause` and `POST /v1/routines/{id}/resume` (owner key), each answering
 * `{ "id": "morning_brief", "name": "Morning briefing", "paused": true }`.
 *
 * An answer this console does not recognise reads as "not available yet", never as an empty rail: a
 * renamed `routines` field, or a list where no row could be read (no id, or a name that is a machine
 * token), is a shape we do not know, not "Mimi runs nothing". `{"routines": []}` is an honest empty
 * list and does show "Mimi has nothing running yet".
 */
export const ROUTINES_PATH = "/v1/routines";
export const routinePausePath = (id: string): string => `${ROUTINES_PATH}/${encodeURIComponent(id)}/pause`;
export const routineResumePath = (id: string): string => `${ROUTINES_PATH}/${encodeURIComponent(id)}/resume`;
