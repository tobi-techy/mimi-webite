"use client";

import { useEffect, useSyncExternalStore } from "react";
import { loadTask, loadTasks } from "@/features/console/api/computer-tasks";
import { isRunning } from "@/features/console/lib/computer-tasks";
import { taskStore, type TaskRecord, type TasksAvailability } from "@/features/console/lib/computer-tasks-store";

/** How often a running task is re-read, in ms. Stops the moment the task is done or stopped. */
const POLL_MS = 4_000;

/** The tasks the service is showing, read once on mount. */
export function useTasks() {
  const state = useSyncExternalStore(taskStore.subscribe, taskStore.get, taskStore.getServer);
  useEffect(() => {
    const ctrl = new AbortController();
    void loadTasks(ctrl.signal).catch(() => {});
    return () => ctrl.abort();
  }, []);
  return state;
}

/**
 * One task by id. Reads the list first (so a link to a task opened on its own still finds its goal),
 * then its step log, and keeps polling while it runs so the log fills in.
 */
export function useComputerTask(id: string): { record: TaskRecord | undefined; loading: boolean; availability: TasksAvailability } {
  const state = useSyncExternalStore(taskStore.subscribe, taskStore.get, taskStore.getServer);
  const record = state.records.find((r) => r.id === id);

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    void (async () => {
      if (!taskStore.find(id)) await loadTasks(ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (!taskStore.find(id))
        taskStore.remember({
          id,
          goal: "",
          kind: null,
          domain: "",
          status: null,
          createdAt: null,
          stepCount: null,
          stopReason: null,
        });
      if (taskStore.get().availability !== "missing") await loadTask(id, ctrl.signal);
    })().catch(() => {});
    return () => ctrl.abort();
  }, [id]);

  const running = isRunning(record?.task?.status ?? record?.status);
  useEffect(() => {
    if (!id || !running) return;
    const ctrl = new AbortController();
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void loadTask(id, ctrl.signal).catch(() => {});
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      ctrl.abort();
    };
  }, [id, running]);

  return { record, loading: !!record && !record.task && record.state !== "error", availability: state.availability };
}
