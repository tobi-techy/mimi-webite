"use client";

import { isAbort, fetchBlobAt, MimiApiError, mimiApi, missingRoute } from "@/features/console/api/client";
import { MIMI_API_URL, USES_API } from "@/features/console/api/config";
import { parseApiTime } from "@/features/console/api/mappers";
import { sessionToken } from "@/features/console/api/session";
import { authed } from "@/features/console/api/sync";
import type { ApiComputerTask, ApiComputerTaskIn, ApiComputerTaskSummary } from "@/features/console/api/types";
import { readKinds, screenshotRequest, type TaskKindOption } from "@/features/console/lib/computer-tasks";
import { taskStore, type TaskRow } from "@/features/console/lib/computer-tasks-store";

/**
 * What the console does with the computer-tasks service. The list is the service's own list; one
 * task's step log is the service's own detail read. A missing or refused call never becomes fake
 * data: it becomes plain words on the screen. The demo session's daily budget still applies, like
 * every other call.
 */

/** The words every screen uses when the service does not have this route (yet). */
export const NOT_AVAILABLE = "Computer tasks are not available yet.";

/** The words for the kinds route alone, so it never borrows the whole surface's sentence. */
export const KINDS_NOT_AVAILABLE = "The service has not published its list of task kinds yet.";

export type ActionResult = { ok: true } | { ok: false; message: string };

/** A failure in plain words. Never a status code, never a raw error. */
function taskMessage(e: unknown, fallback: string): string {
  if (e instanceof MimiApiError) {
    if (e.status === 0) return "The computer service can't be reached right now.";
    if (e.status === 401 || e.status === 403) return "Your session has ended. Sign in again to keep going.";
    if (e.status === 404) return "That task is no longer on the service.";
    if (e.status === 409) return "That task already moved on. Open it again to see where it is.";
    if (e.status === 429) return "Too many runs right now. Try again in a moment.";
  }
  return fallback;
}

/** One list row, keeping only what the API actually sent. */
function rowFromSummary(s: ApiComputerTaskSummary): TaskRow | null {
  const id = s?.task_id;
  if (typeof id !== "string" || !id) return null;
  return {
    id,
    goal: typeof s.goal === "string" ? s.goal : "",
    kind: typeof s.kind === "string" ? s.kind : null,
    domain: typeof s.domain === "string" ? s.domain : "",
    status: typeof s.status === "string" ? s.status : null,
    createdAt: parseApiTime(s.created_at ?? null),
    stepCount: typeof s.step_count === "number" ? s.step_count : null,
    stopReason: typeof s.stop_reason === "string" ? s.stop_reason : null,
  };
}

/** The newest answer for one task, keeping the parts a shorter answer leaves out (steps, plan). */
function mergeTask(existing: ApiComputerTask | null, incoming: ApiComputerTask): ApiComputerTask {
  return {
    ...(existing ?? {}),
    ...incoming,
    plan: incoming.plan ?? existing?.plan,
    steps: incoming.steps ?? existing?.steps,
    artifacts: incoming.artifacts ?? existing?.artifacts,
    stop_reason: incoming.stop_reason ?? existing?.stop_reason,
    /* the signed live link dies with the session: a null from the service is taken as the answer,
       while a response that leaves the field out keeps whatever the last one said */
    live_view_url: "live_view_url" in incoming ? incoming.live_view_url ?? null : existing?.live_view_url ?? null,
  };
}

const putMerged = (id: string, incoming: ApiComputerTask): void => {
  const existing = taskStore.find(id)?.task ?? null;
  taskStore.put(id, mergeTask(existing, incoming));
};

/**
 * The kinds the service takes, with the service's own labels (`GET /v1/computer/kinds`). Read once
 * per page load and kept, so the console never hardcodes a set that could drift from the API's.
 */
let kindsCache: TaskKindOption[] | null = null;

export type KindsResult = { ok: true; kinds: TaskKindOption[] } | { ok: false; message: string };

export async function loadKinds(signal?: AbortSignal): Promise<KindsResult> {
  if (kindsCache) return { ok: true, kinds: kindsCache };
  if (!USES_API) return { ok: false, message: NOT_AVAILABLE };
  try {
    const payload = await authed((t) => mimiApi.computerKinds(t, { signal }));
    const kinds = readKinds(payload);
    if (kinds.length === 0) return { ok: false, message: KINDS_NOT_AVAILABLE };
    kindsCache = kinds;
    return { ok: true, kinds };
  } catch (e) {
    if (missingRoute(e)) return { ok: false, message: KINDS_NOT_AVAILABLE };
    return { ok: false, message: taskMessage(e, "The task kinds could not be read right now.") };
  }
}

/** Reads the list. `missing` means the service does not have the route yet. */
export async function loadTasks(signal?: AbortSignal): Promise<void> {
  if (!USES_API) {
    taskStore.availability("missing");
    taskStore.loaded(true);
    return;
  }
  try {
    const startedAt = taskStore.readStamp();
    const list = await authed((t) => mimiApi.computerTasks(t, { signal }));
    if (!Array.isArray(list?.tasks)) {
      /* a 200 the console cannot read: keep the rows already held rather than clearing the screen */
      taskStore.listError("The computer service sent a task list the console could not read.");
      return;
    }
    const rows = list.tasks.map(rowFromSummary).filter((r): r is TaskRow => r !== null);
    taskStore.replaceAll(rows, startedAt);
    taskStore.availability("ready");
    taskStore.listError(null);
  } catch (e) {
    if (isAbort(e)) throw e;
    if (missingRoute(e)) taskStore.availability("missing");
    else taskStore.listError(taskMessage(e, "The computer service can't be reached right now."));
  } finally {
    taskStore.loaded(true);
  }
}

/**
 * Reads one task: its step log, screenshots and files.
 *
 * A 404 here is about this task, not about the surface: the service answers for the route, it just
 * has no task by that id, so it reads as "that task is no longer on the service" and never as "the
 * service does not have computer tasks". Only the list read decides that.
 *
 * `quiet` is for a read nobody asked for, which is the poll on a running task: it leaves the screen
 * alone, so a poll that fails does not blank the steps that are already on it or blink its own error
 * line, and the next successful read puts them right.
 */
export async function loadTask(id: string, signal?: AbortSignal, opts?: { quiet?: boolean }): Promise<void> {
  if (!USES_API) return;
  if (!opts?.quiet) taskStore.loading(id);
  const epoch = taskStore.writeEpoch(id);
  try {
    const task = await authed((t) => mimiApi.computerTask(t, id, { signal }));
    /* an approve or a stop that landed while this read was in flight is newer than this answer */
    if (taskStore.writeEpoch(id) !== epoch) return;
    putMerged(id, task);
  } catch (e) {
    if (isAbort(e)) throw e;
    if (taskStore.writeEpoch(id) !== epoch) return;
    taskStore.fail(id, taskMessage(e, "This task could not be read. Try again."));
  }
}

/**
 * Asks for a new task. The service proposes it (`status: "proposed"`) and the owner approves it on
 * its own screen. Never retried here: a retry could start a second run.
 */
export async function createTask(input: ApiComputerTaskIn): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!USES_API) return { ok: false, message: NOT_AVAILABLE };
  try {
    const task = await authed((t) => mimiApi.createComputerTask(t, input));
    const id = task?.task_id;
    if (typeof id !== "string" || !id) {
      return { ok: false, message: "The service did not say which task it started. Check the list in a moment." };
    }
    taskStore.remember(
      {
        id,
        goal: input.goal,
        kind: input.kind,
        domain: input.domain,
        status: typeof task.status === "string" ? task.status : null,
        /* the service did not send a creation time, so the Asked column stays empty until it does */
        createdAt: null,
        stepCount: Array.isArray(task.steps) ? task.steps.length : null,
        stopReason: typeof task.stop_reason === "string" ? task.stop_reason : null,
      },
      { local: true },
    );
    taskStore.setUrl(id, input.url);
    putMerged(id, task);
    taskStore.listError(null);
    return { ok: true, id };
  } catch (e) {
    if (isAbort(e)) throw e;
    if (missingRoute(e)) return { ok: false, message: NOT_AVAILABLE };
    return { ok: false, message: taskMessage(e, "The task could not be started. Try again.") };
  }
}

/** The owner approves the whole task once, then it runs under hard guardrails. */
export async function approveTask(id: string): Promise<ActionResult> {
  if (!USES_API) return { ok: false, message: NOT_AVAILABLE };
  try {
    const task = await authed((t) => mimiApi.approveComputerTask(t, id));
    taskStore.markWrite(id);
    putMerged(id, task);
    return { ok: true };
  } catch (e) {
    if (isAbort(e)) throw e;
    return { ok: false, message: taskMessage(e, "That task could not be approved. Try again.") };
  }
}

/** Stops a task the service has not finished with: a running one, or one parked at a sign-in. */
export async function stopTask(id: string): Promise<ActionResult> {
  if (!USES_API) return { ok: false, message: NOT_AVAILABLE };
  try {
    const task = await authed((t) => mimiApi.stopComputerTask(t, id));
    taskStore.markWrite(id);
    putMerged(id, task);
    return { ok: true };
  } catch (e) {
    if (isAbort(e)) throw e;
    return { ok: false, message: taskMessage(e, "That task could not be stopped. Try again.") };
  }
}

/**
 * One step's screenshot, as a Blob (the screen shows it from a `blob:` URL, so no token ever lands
 * in an `<img src>`). The service names the picture and serves it from the task's artifacts. Throws
 * when the reference is one the console will not fetch.
 */
export async function loadScreenshot(
  ref: string | null | undefined,
  taskId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return loadTaskFile(ref, taskId, signal);
}

/** The bytes of one file a task left, named as the service named it. */
export async function loadTaskFile(
  ref: string | null | undefined,
  taskId: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const request = screenshotRequest(ref, MIMI_API_URL, taskId);
  if (!request) throw new Error("file cannot be fetched");
  const token = request.auth ? await sessionToken() : null;
  return fetchBlobAt(request.url, token, signal);
}
