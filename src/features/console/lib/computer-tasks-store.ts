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
  /**
   * The service's own code for why it stopped (`stopped_by_owner`, `off_domain`). Never shown: it
   * chooses nothing on screen either, it is kept so a record does not lose what the service said.
   */
  stopReason: string | null;
  /** Why it stopped, in the service's own plain words. This is the line a person reads. */
  note: string | null;
  /** The detail read (step log, files), or null before the detail route has answered. */
  task: ApiComputerTask | null;
  state: "idle" | "loading" | "ready" | "error";
  /** A plain-word reason the detail read failed, or null. */
  error: string | null;
  /**
   * When the current `status` was learned (see `stamp`): a list read older than a detail read keeps
   * the detail read's status, so a task approved elsewhere does not go back to Waiting on refresh.
   */
  statusAt: number;
  /** True when this console asked for the task and the list has not carried it yet. */
  local: boolean;
};

/** What a row from the list carries. */
export type TaskRow = Pick<
  TaskRecord,
  "id" | "goal" | "kind" | "domain" | "status" | "createdAt" | "stepCount" | "stopReason" | "note"
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

/**
 * One counter for everything the console learns, so two answers about the same task can be ordered:
 * a read that started before a later answer arrived must not overwrite it.
 */
let tick = 0;
const stamp = (): number => ++tick;

/** How many times the console has written to one task on purpose (approve, stop), for the same reason. */
const writes = new Map<string, number>();

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
  statusAt: stamp(),
  local: false,
});

export const taskStore = {
  get: (): TasksState => state,
  getServer: (): TasksState => EMPTY,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /**
   * The list read: the API is the source of truth, so its rows replace what is held. `startedAt` is
   * the stamp from `readStamp` when the read went out, so a detail read that landed while it was in
   * flight is not overwritten by the older list row.
   */
  replaceAll(rows: TaskRow[], startedAt?: number): void {
    const at = startedAt ?? stamp();
    const before = new Map(state.records.map((r) => [r.id, r]));
    const records = rows.map((row) => {
      const prev = before.get(row.id);
      if (!prev) return blank(row);
      /* a detail read that landed after this list read started knows more than the list row does */
      const keepStatus = prev.statusAt > at;
      return {
        ...prev,
        ...row,
        /* an older list row must not push back the status, the step count, or why the task stopped */
        status: keepStatus ? prev.status : row.status,
        statusAt: keepStatus ? prev.statusAt : at,
        stepCount: keepStatus ? prev.stepCount : row.stepCount,
        stopReason: keepStatus ? prev.stopReason : row.stopReason,
        note: keepStatus ? prev.note : row.note,
        /* keep whatever the detail read already gave, and the start page of a task asked for here */
        task: prev.task,
        error: prev.error,
        state: prev.state === "idle" && prev.task ? ("ready" as const) : prev.state,
        /* the list carried it, so it is no longer only this console's copy */
        local: false,
      };
    });
    /* a task asked for here is kept until the list carries it: the POST's plan and start page are
       not in a list row, and dropping them would throw away what the owner was just shown */
    const carried = new Set(rows.map((r) => r.id));
    const kept = state.records.filter((r) => r.local && !carried.has(r.id));
    set({ records: kept.length ? [...kept, ...records] : records });
  },
  /**
   * Adds one task the console knows about but the list has not carried yet. `local` marks a task this
   * console asked for, which the list is allowed to lag behind.
   */
  remember(row: TaskRow, opts: { local?: boolean } = {}): void {
    if (state.records.some((r) => r.id === row.id)) return;
    set({ records: [{ ...blank(row), local: !!opts.local }, ...state.records] });
  },
  find: (id: string): TaskRecord | undefined => state.records.find((r) => r.id === id),
  /** A stamp for a read that is about to go out, so a later answer can be ordered against it. */
  readStamp: (): number => stamp(),
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
      statusAt: task?.status ? stamp() : r.statusAt,
      stepCount: Array.isArray(task?.steps) ? task.steps.length : r.stepCount,
      stopReason: task?.stop_reason ?? r.stopReason,
      note: task?.note ?? r.note,
    }));
  },
  fail(id: string, message: string): void {
    patchRecord(id, (r) => ({ ...r, state: "error", error: message }));
  },
  /**
   * A write the console made on purpose (approve, stop). A read that started before it must not
   * write its older answer on top once it lands.
   */
  markWrite(id: string): void {
    writes.set(id, (writes.get(id) ?? 0) + 1);
  },
  writeEpoch(id: string): number {
    return writes.get(id) ?? 0;
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
    writes.clear();
    emit();
  },
};
