/**
 * Computer tasks the console is showing. The list comes from GET /v1/computer/tasks; one task's step
 * log comes from GET /v1/computer/tasks/{id}. Nothing is kept between reloads and nothing is ever
 * invented: a field the API did not send stays null and the screens say so.
 */
import type { ApiComputerTask } from "../api/types";

export type TaskRecord = {
  /** Internal handle only: never shown to a person (see the list and detail views). */
  id: string;
  goal: string;
  /** The kind of task (one of the owner's set), or null before the API says. */
  kind: string | null;
  domain: string;
  /** The page a task started on, when this console asked for it. Often empty. */
  url: string;
  status: string | null;
  /** Epoch ms of `created_at`, or null when the API did not send a readable one. */
  createdAt: number | null;
  stepCount: number | null;
  stopReason: string | null;
  /** The detail read (step log, files), or null before the detail route has answered. */
  task: ApiComputerTask | null;
  state: "idle" | "loading" | "ready" | "error";
  /** A plain-word reason the detail read failed, or null. */
  error: string | null;
};

/** What a row from the list carries. */
export type TaskRow = Pick<
  TaskRecord,
  "id" | "goal" | "kind" | "domain" | "status" | "createdAt" | "stepCount" | "stopReason"
>;

/** Whether the service answers at all. `missing` means the routes are not there yet. */
export type TasksAvailability = "unknown" | "ready" | "missing";

export type TasksState = {
  records: readonly TaskRecord[];
  availability: TasksAvailability;
  /** True once the first list read has finished (so screens stop showing the skeleton). */
  loaded: boolean;
  /** A plain-word reason the last list read failed, or null. */
  listError: string | null;
};

const EMPTY: TasksState = { records: [], availability: "unknown", loaded: false, listError: null };

let state: TasksState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<TasksState>) {
  state = { ...state, ...patch };
  emit();
}

const patchRecord = (id: string, change: (r: TaskRecord) => TaskRecord) => {
  set({ records: state.records.map((r) => (r.id === id ? change(r) : r)) });
};

const blank = (row: TaskRow): TaskRecord => ({
  ...row,
  url: "",
  task: null,
  state: "idle",
  error: null,
});

export const taskStore = {
  get: (): TasksState => state,
  getServer: (): TasksState => EMPTY,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** The list read: the API is the source of truth, so its rows replace what is held. */
  replaceAll(rows: TaskRow[]): void {
    const before = new Map(state.records.map((r) => [r.id, r]));
    const records = rows.map((row) => {
      const prev = before.get(row.id);
      if (!prev) return blank(row);
      return {
        ...prev,
        ...row,
        /* keep whatever the detail read already gave, and the start page of a task asked for here */
        task: prev.task,
        error: prev.error,
        state: prev.state === "idle" && prev.task ? ("ready" as const) : prev.state,
      };
    });
    set({ records });
  },
  /** Adds one task the console knows about but the list has not carried yet (a fresh create). */
  remember(row: TaskRow): void {
    if (state.records.some((r) => r.id === row.id)) return;
    set({ records: [blank(row), ...state.records] });
  },
  find: (id: string): TaskRecord | undefined => state.records.find((r) => r.id === id),
  /** The start page of a task asked for here (not part of the API's list row). */
  setUrl(id: string, url: string): void {
    patchRecord(id, (r) => ({ ...r, url }));
  },
  loading(id: string): void {
    patchRecord(id, (r) => ({ ...r, state: "loading", error: null }));
  },
  put(id: string, task: ApiComputerTask | null): void {
    patchRecord(id, (r) => ({
      ...r,
      task,
      state: "ready",
      error: null,
      status: task?.status ?? r.status,
      stepCount: Array.isArray(task?.steps) ? task.steps.length : r.stepCount,
      stopReason: task?.stop_reason ?? r.stopReason,
    }));
  },
  fail(id: string, message: string): void {
    patchRecord(id, (r) => ({ ...r, state: "error", error: message }));
  },
  availability(value: TasksAvailability): void {
    if (state.availability !== value) set({ availability: value });
  },
  loaded(value: boolean): void {
    if (state.loaded !== value) set({ loaded: value });
  },
  listError(message: string | null): void {
    if (state.listError !== message) set({ listError: message });
  },
  reset(): void {
    state = EMPTY;
    emit();
  },
};
