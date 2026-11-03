"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { loadKinds, loadTask, loadTasks } from "@/features/console/api/computer-tasks";
import { holdsSession } from "@/features/console/lib/computer-tasks";
import { taskStore, type TaskRecord, type TasksAvailability } from "@/features/console/lib/computer-tasks-store";
import type { TaskKindOption } from "@/features/console/lib/computer-tasks";

/** How often a task with a session open is re-read, in ms. Stops once the task is done or stopped. */
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
 * The kinds the service takes, with its own labels. Read once per page load, kept in the API layer,
 * so nothing here decides what the kinds are.
 */
export function useTaskKinds(): { kinds: TaskKindOption[]; problem: string | null; loading: boolean } {
  const [state, setState] = useState<{ kinds: TaskKindOption[]; problem: string | null; loading: boolean }>({
    kinds: [],
    problem: null,
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    loadKinds(ctrl.signal)
      .then((res) => {
        if (!alive) return;
        setState(
          res.ok
            ? { kinds: res.kinds, problem: null, loading: false }
            : { kinds: [], problem: res.message, loading: false },
        );
      })
      .catch(() => {
        if (alive) setState({ kinds: [], problem: "The task kinds could not be read right now.", loading: false });
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
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

  const running = holdsSession(record?.task?.status ?? record?.status);
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
