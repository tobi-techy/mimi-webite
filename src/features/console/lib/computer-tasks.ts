/**
 * Computer tasks: the console side of the hosted cloud browser (one per task). Pure functions only,
 * so `npm run test:console` runs them in node with no DOM. Nothing here invents data: a field the
 * API has not sent stays empty and the screens say so.
 */
import type { ApiComputerTask, ApiComputerTaskArtifact, ApiComputerTaskStep } from "../api/types";
import { toPlainText } from "./plain-text.ts";
import { safeHref } from "./safe-href.ts";

/** How one task reads at a glance. `unknown` keeps a status word the console does not know yet. */
export type TaskTone = "proposed" | "running" | "done" | "stopped" | "failed" | "unknown";

const TONES: Record<string, TaskTone> = {
  proposed: "proposed",
  queued: "proposed",
  running: "running",
  done: "done",
  finished: "done",
  completed: "done",
  stopped: "stopped",
  cancelled: "stopped",
  failed: "failed",
  error: "failed",
};

/** The tone for a status word from the API (folded to lower case, spaces and dashes read as underscores). */
export function taskTone(status: string | null | undefined): TaskTone {
  const key = (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return TONES[key] ?? "unknown";
}

const WORDS: Record<TaskTone, string> = {
  proposed: "Waiting for your approval",
  running: "Running",
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

/** True while the task is on the computer right now. */
export const isRunning = (status: string | null | undefined): boolean => taskTone(status) === "running";

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
  if (!isTaskKind(input.kind)) return "Choose what kind of task this is.";
  const goal = input.goal.trim();
  if (!goal) return "Say what the task should do.";
  if (goal.length < 4) return "Say what the task should do, in a little more detail.";
  if (goal.length > MAX_GOAL) return `Keep the goal under ${MAX_GOAL} characters.`;
  const url = input.url.trim();
  if (!url) return "Add the website the task should start on.";
  if (!isHttpUrl(url)) return "Use a full web address, starting with https://.";
  if (!deriveDomain(url)) return "That web address has no site name. Check it and try again.";
  return null;
}

/** What a step reads as when the service sent no sentence of its own. */
export const STEP_NO_SENTENCE = "The service did not send a sentence for this step.";

/**
 * One step's sentence, in the step's own words: the distributor reads this to understand what Mimi
 * did, so the console never rewrites it and never turns a code into a made-up description. When the
 * service sends nothing readable, that is said plainly rather than dressed up.
 */
export function stepSentence(step: ApiComputerTaskStep | null | undefined): string {
  const raw = typeof step?.action === "string" ? step.action : "";
  const text = toPlainText(raw).trim();
  return text || STEP_NO_SENTENCE;
}

/**
 * What a task is for. These are the four the owner named, plus the generic one; the values are the
 * slugs the service is told (kept in step with the API's own set).
 */
export type TaskKind = "price_list" | "order_list" | "bank_statement" | "form" | "other";

export const TASK_KINDS: ReadonlyArray<{ value: TaskKind; label: string; hint: string }> = [
  { value: "price_list", label: "Price lists and promos", hint: "Check a brand or supplier portal" },
  { value: "order_list", label: "Order list", hint: "Pull the orders from a supplier portal" },
  { value: "bank_statement", label: "Bank statement", hint: "Download a statement from a bank portal" },
  { value: "form", label: "Form or filing", hint: "Fill a form on a government or tax portal" },
  { value: "other", label: "Something else", hint: "Any other task on a website" },
];

const KIND_LABELS: Record<string, string> = Object.fromEntries(TASK_KINDS.map((k) => [k.value, k.label]));

/** True when the value is one of the kinds the service is told. */
export const isTaskKind = (value: string): value is TaskKind => value in KIND_LABELS;

/**
 * How a task's kind reads. A kind the console does not know is shown as the API's own words, so a
 * new kind on the service is never hidden.
 */
export function taskKindLabel(kind: string | null | undefined): string {
  const key = (kind ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!key) return "";
  return KIND_LABELS[key] ?? key.replace(/_+/g, " ").replace(/^./, (c) => c.toUpperCase());
}


/**
 * A signed link to watch a running task's browser. The service mints it mid-run and lets it lapse
 * when the task ends, so the console links to it only while the task is running and only when the
 * service actually handed one over. Nothing is guessed at: no link, no link shown.
 */
export function liveViewLink(task: ApiComputerTask | null | undefined): string | null {
  if (!isRunning(task?.status)) return null;
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
  const lines = plan.filter((l): l is string => typeof l === "string" && l.trim().length > 0);
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
  if (/^https:\/\//i.test(raw)) return { url: raw, auth: sameOrigin(raw, base) };
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
