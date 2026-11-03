/**
 * Computer tasks: the console side of the hosted cloud browser (one per task). Pure functions only,
 * so `npm run test:console` runs them in node with no DOM. Nothing here invents data: a field the
 * API has not sent stays empty and the screens say so.
 */
import type { ApiComputerTask, ApiComputerTaskArtifact, ApiComputerTaskStep } from "../api/types";
import { toPlainText } from "./plain-text.ts";
import { safeHref } from "./safe-href.ts";

/** How one task reads at a glance. `unknown` keeps a status word the console does not know yet. */
export type TaskTone = "proposed" | "running" | "paused" | "done" | "stopped" | "failed" | "unknown";

const TONES: Record<string, TaskTone> = {
  proposed: "proposed",
  queued: "proposed",
  running: "running",
  /* parked at a sign-in wall: it is neither waiting for approval nor still running */
  awaiting_owner: "paused",
  done: "done",
  finished: "done",
  completed: "done",
  stopped: "stopped",
  cancelled: "stopped",
  failed: "failed",
  error: "failed",
};

/** A status word folded to one shape (lower case, spaces and dashes as underscores). */
const fold = (status: string | null | undefined): string => (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

/** The tones the service has finished with: nothing more to wait for, and nothing left to stop. */
const FINISHED_TONES: readonly TaskTone[] = ["done", "stopped", "failed"];

/** The tone for a status word from the API. */
export function taskTone(status: string | null | undefined): TaskTone {
  return TONES[fold(status)] ?? "unknown";
}

const WORDS: Record<TaskTone, string> = {
  proposed: "Waiting for your approval",
  running: "Running",
  paused: "Waiting for you to sign in",
  done: "Done",
  stopped: "Stopped",
  failed: "Failed",
  unknown: "In progress",
};

/**
 * The plain word beside the pill: a known status reads in full words ("Waiting for your approval");
 * a status word the console does not know is shown as the API's own word, so nothing is hidden.
 */
export function taskStateWord(status: string | null | undefined): string {
  const tone = taskTone(status);
  if (tone !== "unknown") return WORDS[tone];
  const raw = (status ?? "").trim().replace(/[_-]+/g, " ");
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : WORDS.unknown;
}

/** The short word for a filter tab and a list row. */
export function taskShortWord(status: string | null | undefined): string {
  switch (taskTone(status)) {
    case "proposed":
      return "Waiting";
    case "running":
      return "Running";
    case "paused":
      return "Waiting";
    case "done":
      return "Done";
    case "stopped":
      return "Stopped";
    case "failed":
      return "Failed";
    default:
      return taskStateWord(status);
  }
}

/** True when a task is parked waiting on the owner; these are the ones the list calls out first. */
export const needsOwner = (status: string | null | undefined): boolean => taskTone(status) === "proposed";

/** True when the task is parked at a sign-in wall, waiting for the owner to sign in. */
export const needsSignIn = (status: string | null | undefined): boolean => taskTone(status) === "paused";

/** True while the task is on the computer right now. */
export const isRunning = (status: string | null | undefined): boolean => taskTone(status) === "running";

/** True when the service has finished with the task: nothing more will happen without a new task. */
export const isFinished = (status: string | null | undefined): boolean => FINISHED_TONES.includes(taskTone(status));

/**
 * True when the owner can still get rid of a task: the service has not finished with it. That covers
 * a task waiting on an approval, a task parked at a sign-in, and a running one, so there is always a
 * way out. Once a task is done, stopped or failed, there is nothing left to stop.
 */
export const canStop = (status: string | null | undefined): boolean => !isFinished(status);

/** A full web address (the only kind the console will hand to the service). */
export function isHttpUrl(value: string): boolean {
  const raw = value.trim();
  if (!/^https?:\/\//i.test(raw)) return false;
  try {
    return new URL(raw).hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * The host of a web address ("ibank.providusbank.com"), for the `domain` field and for display.
 * Empty when the address cannot be read, so a screen shows nothing rather than a made-up host.
 */
export function deriveDomain(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname;
  } catch {
    return "";
  }
}

/** The longest goal the service is asked to take. */
export const MAX_GOAL = 2000;

/** A plain-word complaint about the new-task form, or null when it is ready to send. */
export function validateNewTask(input: { kind: string; goal: string; url: string }): string | null {
  if (!input.kind.trim()) return "Choose what kind of task this is.";
  const goal = input.goal.trim();
  if (!goal) return "Say what the task should do.";
  if (goal.length < 4) return "Say what the task should do, in a little more detail.";
  if (goal.length > MAX_GOAL) return `Keep the goal under ${MAX_GOAL} characters.`;
  const url = input.url.trim();
  if (!url) return "Add the website the task should start on.";
  if (!isHttpUrl(url)) return "Use a full web address, starting with http:// or https://.";
  if (!deriveDomain(url)) return "That web address has no site name. Check it and try again.";
  return null;
}

/** What a step reads as when the service sent no sentence of its own. */
export const STEP_NO_SENTENCE = "The service did not send a sentence for this step.";

/** What a step reads as when the service sent words, but a machine token instead of a sentence. */
export const STEP_UNREADABLE = "The service sent this step without words a person can read, so it is left out here.";

/** The same, for one line of the plan the service proposed. */
export const PLAN_UNREADABLE = "The service sent this step of the plan without words a person can read.";

/**
 * True when a step's own words are a machine token rather than a sentence: an underscore- or
 * hyphen-joined token such as `goto_url`, `GOTO_URL` or `Click_btn_2`. A token like that is a bug at
 * the source, so the two screens that show a step's words say so and keep the token off the screen,
 * which keeps the bug visible in the data and keeps gibberish off a distributor's screen. Anything
 * with a space in it is left alone: it is prose, and the console does not second-guess the wording.
 */
export function looksLikeCode(value: string | null | undefined): boolean {
  const raw = (value ?? "").trim();
  if (!raw || /\s/.test(raw)) return false;
  return /^[a-z0-9]+(?:[_-][a-z0-9]+)+$/i.test(raw);
}

/**
 * One step's sentence, in the step's own words: the distributor reads this to understand what Mimi
 * did, so the console never rewrites it and never turns a code into a made-up description. A step the
 * service sent no words for, and a step whose words are a machine token, each get their own plainly
 * worded line, and the token itself stays off the screen.
 */
export function stepSentence(step: ApiComputerTaskStep | null | undefined): string {
  const raw = typeof step?.action === "string" ? step.action : "";
  const text = toPlainText(raw).trim();
  if (!text) return STEP_NO_SENTENCE;
  return looksLikeCode(text) ? STEP_UNREADABLE : text;
}

/** One step's note in the service's own words, or "" when it sent none or sent a machine token. */
export function stepNote(step: ApiComputerTaskStep | null | undefined): string {
  const raw = typeof step?.note === "string" ? step.note : "";
  const text = toPlainText(raw).trim();
  return text && !looksLikeCode(text) ? text : "";
}

/**
 * The page a step was on, when the service sent a full web address. Gated, never reshaped: a bare
 * host is not turned into one, because a step's view of where it was is the service's to state.
 */
export function stepUrl(step: ApiComputerTaskStep | null | undefined): string {
  const raw = (typeof step?.url === "string" ? step.url : "").trim();
  return isHttpUrl(raw) ? raw : "";
}

/**
 * What a task is for. The list and its labels come from the service (`GET /v1/computer/kinds`), which
 * is the single source, so the console and the API cannot drift apart. Nothing is hardcoded here.
 */
export type TaskKindOption = { kind: string; label: string };

/** Reads the kinds the service publishes: an entry with a kind and a label, or a bare kind. */
export function readKinds(payload: { kinds?: unknown } | null | undefined): TaskKindOption[] {
  const raw = payload?.kinds;
  if (!Array.isArray(raw)) return [];
  const out: TaskKindOption[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      if (entry.trim()) out.push({ kind: entry.trim(), label: "" });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const kind = (entry as { kind?: unknown }).kind;
    const label = (entry as { label?: unknown }).label;
    if (typeof kind !== "string" || !kind.trim()) continue;
    out.push({ kind: kind.trim(), label: typeof label === "string" ? label.trim() : "" });
  }
  return out;
}

/**
 * How a task's kind reads, in the service's own words. A kind the service listed no label for, or
 * one it does not list at all, reads as nothing rather than as a label the console made up.
 */
export function kindLabel(kind: string | null | undefined, kinds: TaskKindOption[]): string {
  const key = (kind ?? "").trim().toLowerCase();
  if (!key) return "";
  const found = kinds.find((k) => k.kind.toLowerCase() === key);
  return found?.label ?? "";
}

/** True when the service lists this kind. */
export function isListedKind(kind: string | null | undefined, kinds: TaskKindOption[]): boolean {
  const key = (kind ?? "").trim().toLowerCase();
  return !!key && kinds.some((k) => k.kind.toLowerCase() === key);
}


/**
 * A signed link to watch the task's browser. The service mints it mid-run and lets it lapse when the
 * session closes, so the link is shown whenever the service hands one over, whatever the status: a
 * task parked at a sign-in keeps its session and its link on purpose, because that is the state where
 * the owner has to sign in. Once the service has finished with a task the link is never shown, even
 * if a merged answer still carries one, because the session behind it is gone.
 */
export function liveViewLink(task: ApiComputerTask | null | undefined): string | null {
  if (FINISHED_TONES.includes(taskTone(task?.status))) return null;
  const href = safeHref(task?.live_view_url ?? "");
  return href && /^https:\/\//i.test(href) ? href : null;
}

/** The steps of a task, in the order the API sent them, with only what it actually gave. */
export function stepsOf(task: ApiComputerTask | null | undefined): ApiComputerTaskStep[] {
  const steps = task?.steps;
  if (!Array.isArray(steps)) return [];
  return steps.filter((s): s is ApiComputerTaskStep => !!s && typeof s === "object");
}

/** The plan the service proposed (from the POST response; a later GET may not carry it). */
export function planOf(task: ApiComputerTask | null | undefined, fallback: readonly string[] = []): string[] {
  const plan = task?.plan;
  if (!Array.isArray(plan)) return [...fallback];
  /* a plan line the service sent as a machine token is said so, so the plan keeps its shape */
  const lines = plan
    .filter((l): l is string => typeof l === "string" && l.trim().length > 0)
    .map((l) => {
      const text = toPlainText(l).trim();
      return looksLikeCode(text) ? PLAN_UNREADABLE : text;
    });
  return lines.length ? lines : [...fallback];
}

/** A task with no goal of its own reads by its pace, never by a made-up label. */
export function taskTitle(goal: string | null | undefined): string {
  const text = (goal ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "Computer task";
  return text.length > 90 ? `${text.slice(0, 89).trimEnd()}…` : text;
}

/**
 * Where a step's screenshot is read from, and whether the session token must go with it.
 *
 * The service names a screenshot and serves its bytes from the artifacts sub-resource, so a bare
 * name becomes `GET /v1/computer/tasks/{id}/artifacts/{name}`. A path or an https address is used as
 * given. Only the API's own origin gets the bearer. Anything the console will not fetch (data:,
 * blob:, http:, protocol-relative) returns null, and the step says the screenshot could not be shown
 * instead of showing a broken or stand-in image.
 */
export function screenshotRequest(
  ref: string | null | undefined,
  apiUrl: string,
  taskId: string,
): { url: string; auth: boolean } | null {
  const raw = (ref ?? "").trim();
  if (!raw || raw.startsWith("//")) return null;
  if (/^(data|blob):/i.test(raw)) return null;
  const base = apiUrl.trim().replace(/\/+$/, "");
  if (/^https:\/\//i.test(raw)) {
    /* only the API's own origin: the shipped console's CSP allows its own origin and the API's, and
       a picture the browser would block is shown as "could not be shown" instead of being attempted */
    return base && sameOrigin(raw, base) ? { url: raw, auth: true } : null;
  }
  if (/^http:\/\//i.test(raw)) return null;
  if (raw.startsWith("/")) return base ? { url: `${base}${raw}`, auth: true } : null;
  const artifact = artifactUrl(base, taskId, raw);
  return artifact ? { url: artifact, auth: true } : null;
}

/** The sub-resource that serves one artifact's bytes (a screenshot or a file the task left). */
export function artifactUrl(apiUrl: string, taskId: string, name: string): string | null {
  const base = apiUrl.trim().replace(/\/+$/, "");
  const id = taskId.trim();
  const file = name.trim();
  if (!base || !id || !file) return null;
  return `${base}/v1/computer/tasks/${encodeURIComponent(id)}/artifacts/${encodeURIComponent(file)}`;
}

function sameOrigin(a: string, base: string): boolean {
  if (!base) return false;
  try {
    return new URL(a).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

export type TaskArtifact = { label: string; href?: string; file?: string };

/** Reads the label the API used for a file, whatever it called the field. Never invents one. */
function artifactLabel(raw: ApiComputerTaskArtifact): string {
  if (typeof raw === "string") return raw;
  for (const key of ["label", "name", "title", "filename", "file"]) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** A bare file name, as opposed to a path or an address. */
function bareName(v: string): string {
  const s = v.trim();
  if (!s || /[\\/]/.test(s) || /^[a-z][a-z0-9+.-]*:/i.test(s)) return "";
  return s;
}

/**
 * The API's own name for a file, when it gave a bare name rather than an address: the console asks
 * the task's artifacts sub-resource for those bytes instead of linking to a name nobody serves.
 */
function artifactFileName(raw: ApiComputerTaskArtifact): string {
  if (typeof raw === "string") return bareName(raw);
  for (const key of ["name", "filename", "file"]) {
    const v = raw[key];
    if (typeof v === "string") {
      const name = bareName(v);
      if (name) return name;
    }
  }
  return "";
}

/** A file's link: an https address or a path inside the console, and nothing else. */
function artifactHref(raw: ApiComputerTaskArtifact): string | undefined {
  if (typeof raw === "string") return safeHref(raw);
  for (const key of ["url", "href", "link", "path"]) {
    const v = raw[key];
    if (typeof v === "string") {
      const href = safeHref(v);
      if (href) return href;
    }
  }
  return undefined;
}

/**
 * The files a task produced, in the order the API sent them. An entry with no readable label is
 * kept as a plain link's address; an entry with neither is dropped rather than guessed at.
 */
export function normalizeArtifacts(artifacts: ApiComputerTaskArtifact[] | null | undefined): TaskArtifact[] {
  if (!Array.isArray(artifacts)) return [];
  const out: TaskArtifact[] = [];
  for (const raw of artifacts) {
    if (!raw || (typeof raw !== "object" && typeof raw !== "string")) continue;
    const label = artifactLabel(raw);
    const href = artifactHref(raw);
    const file = href ? "" : artifactFileName(raw);
    if (label) out.push({ label, ...(href ? { href } : {}), ...(file ? { file } : {}) });
    else if (href) out.push({ label: href, href });
    else if (file) out.push({ label: file, file });
  }
  return out;
}

/** Why a task stopped, in plain words, or "" when the API has not said. */
export function describeStop(reason: string | null | undefined): string {
  const text = (reason ?? "").replace(/\s+/g, " ").trim();
  return text;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** When the owner asked for a task, in Lagos time: "3 Nov, 10:39". */
export function askedLabel(at: number): string {
  const d = new Date(at + 60 * 60_000);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}, ${hh}:${mm}`;
}
