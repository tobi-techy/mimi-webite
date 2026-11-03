import assert from "node:assert/strict";
import { test } from "node:test";
import { taskStore, type TaskRow } from "./computer-tasks-store.ts";

const row = (id: string, over: Partial<TaskRow> = {}): TaskRow => ({
  id,
  goal: "Read the statement",
  kind: "bank_statement",
  domain: "ibank.providusbank.com",
  status: "proposed",
  createdAt: null,
  stepCount: 0,
  stopReason: null,
  ...over,
});

test("the list read replaces what is held", () => {
  taskStore.reset();
  taskStore.replaceAll([row("a"), row("b")]);
  assert.equal(taskStore.get().records.length, 2);
  taskStore.replaceAll([row("a", { status: "done" })]);
  assert.equal(taskStore.get().records.length, 1);
  assert.equal(taskStore.find("a")?.status, "done");
});

test("a detail already read survives the next list read", () => {
  taskStore.reset();
  taskStore.replaceAll([row("a")]);
  taskStore.put("a", { task_id: "a", status: "running", steps: [{ index: 1, action: "Opened the site" }] });
  assert.equal(taskStore.find("a")?.status, "running");
  assert.equal(taskStore.find("a")?.stepCount, 1);
  taskStore.replaceAll([row("a")]);
  assert.equal(taskStore.find("a")?.task?.status, "running");
  /* the list's own step count wins until the next detail read refreshes it */
  assert.equal(taskStore.find("a")?.stepCount, 0);
});

test("a task asked for here is remembered once, with its start page", () => {
  taskStore.reset();
  taskStore.remember(row("x"));
  taskStore.remember(row("x"));
  assert.equal(taskStore.get().records.length, 1);
  taskStore.setUrl("x", "https://ibank.providusbank.com");
  assert.equal(taskStore.find("x")?.url, "https://ibank.providusbank.com");
});

test("availability, loaded and the list error", () => {
  taskStore.reset();
  assert.equal(taskStore.get().availability, "unknown");
  assert.equal(taskStore.get().loaded, false);
  taskStore.availability("missing");
  taskStore.loaded(true);
  taskStore.listError("The computer service can't be reached right now.");
  assert.equal(taskStore.get().availability, "missing");
  assert.equal(taskStore.get().loaded, true);
  assert.equal(taskStore.get().listError, "The computer service can't be reached right now.");
  taskStore.reset();
  assert.deepEqual(taskStore.get().records, []);
  assert.equal(taskStore.get().availability, "unknown");
});

test("a failed detail read keeps the last summary and records why", () => {
  taskStore.reset();
  taskStore.replaceAll([row("a")]);
  taskStore.loading("a");
  assert.equal(taskStore.find("a")?.state, "loading");
  taskStore.fail("a", "This task could not be read. Try again.");
  assert.equal(taskStore.find("a")?.state, "error");
  assert.equal(taskStore.find("a")?.error, "This task could not be read. Try again.");
  assert.equal(taskStore.find("a")?.goal, "Read the statement");
});
