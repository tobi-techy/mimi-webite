/**
 * Which data the console shows, fixed at build time:
 *
 * - `NEXT_PUBLIC_MIMI_MODE` unset: today's static sample data (no network at all).
 * - `NEXT_PUBLIC_MIMI_MODE=demo` + `NEXT_PUBLIC_MIMI_API_URL`: the public demo. The console asks the
 *   MIMI-AGENT API for a demo session on first load and shows that session's own copy of Coral Lane
 *   Trading. If the API cannot be reached it falls back to the static sample data.
 * - `NEXT_PUBLIC_MIMI_MODE=live`: real distributors. Closed until sign-in is built: every console
 *   route shows the sign-in screen and nothing is fetched.
 *
 * Both values are read with literal `process.env.NEXT_PUBLIC_*` so Next inlines them into the bundle.
 */
export type MimiMode = "static" | "demo" | "live";

const rawMode = (process.env.NEXT_PUBLIC_MIMI_MODE ?? "").trim().toLowerCase();
const rawUrl = (process.env.NEXT_PUBLIC_MIMI_API_URL ?? "").trim().replace(/\/+$/, "");

export const MIMI_API_URL: string = rawUrl;

export const MIMI_MODE: MimiMode =
  rawMode === "live" ? "live" : rawMode === "demo" && rawUrl ? "demo" : "static";

/**
 * Live mode needs a bearer from a sign-in flow, which does not exist yet. Until it does this stays
 * false and live builds show the sign-in screen only (closed by default, no access).
 */
export const LIVE_SIGN_IN_READY = false;

/** True when the console talks to the API in this build (the demo build with an API address). */
export const USES_API = MIMI_MODE === "demo";

/**
 * Where Command (channels, messages, items, the digest) reads from.
 *
 * - `preview` (default): the typed mock in content/command-mock.ts, through the same mapper the real
 *   routes use. The screens say in plain words that this is a preview and not connected yet.
 * - `api`: the real `/v1/channels`, `/v1/channels/{id}/messages`, `/v1/items`, `/v1/needs-you` and
 *   `/v1/digest/today` routes. Set `NEXT_PUBLIC_MIMI_COMMAND=api` once the backend slices land: the
 *   screens do not change.
 */
export const COMMAND_SOURCE: "preview" | "api" = (process.env.NEXT_PUBLIC_MIMI_COMMAND ?? "").trim().toLowerCase() === "api" ? "api" : "preview";
