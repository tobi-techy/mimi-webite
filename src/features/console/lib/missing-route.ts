/**
 * "This API build does not have that route" (Tobi, 4 Nov 2026). One rule, because two different
 * answers look alike and mean opposite things:
 *
 * - A path this build does not serve: FastAPI answers 404 with `{"detail": "Not Found"}`.
 * - A route that exists and refused the request: `POST /v1/routines/{id}/run` answers 404 with
 *   `{"detail": "unknown routine"}` for a routine it does not have, and 409 with its own sentence
 *   for a refusal (already ran today, or paused).
 *
 * Only the first is "not available yet" on the console, so the detail is read, never the status on
 * its own: a refusal must never be mistaken for a missing route (it would silence a real answer and
 * hide a working control), and a missing route must never be shown as a refusal in the API's voice.
 * `api/client.ts` is the one caller for errors; the test next to this file pins both bodies.
 */
export function routeMissing(status: number, detail: string): boolean {
  return (status === 404 || status === 405) && (!detail.trim() || /^not found$/i.test(detail.trim()));
}
