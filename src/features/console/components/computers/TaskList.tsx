"use client";

import Link from "next/link";
import { useState } from "react";
import { USES_API } from "@/features/console/api/config";
import { NotAvailable, NotYet } from "@/features/console/components/computers/NotAvailable";
import { TaskStatusPill } from "@/features/console/components/computers/TaskStatusPill";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { ButtonLink } from "@/features/console/components/ui/Button";
import { Chip } from "@/features/console/components/ui/Chip";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { PageMenu } from "@/features/console/components/ui/PageMenu";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { Table } from "@/features/console/components/ui/Table";
import { computerTaskHref, consoleRoutes } from "@/features/console/config";
import { useTaskKinds, useTasks } from "@/features/console/hooks/use-computer-tasks";
import { askedLabel, isRunning, kindLabel, needsOwner, needsSignIn, taskTitle, taskTone } from "@/features/console/lib/computer-tasks";
import type { TaskRecord } from "@/features/console/lib/computer-tasks-store";

type Filter = "all" | "waiting" | "running" | "finished";

/** The newest status the console has for a row: the detail read wins over the list's summary. */
const statusOf = (r: TaskRecord): string | null => r.task?.status ?? r.status;

/** The kind of task, from the list row or the detail read. */
const kindOf = (r: TaskRecord): string | null => r.kind ?? r.task?.kind ?? null;

const inFilter = (filter: Filter, r: TaskRecord): boolean => {
  const status = statusOf(r);
  switch (filter) {
    case "waiting":
      /* waiting on an approval, or parked at a sign-in: both are the owner's turn */
      return needsOwner(status) || needsSignIn(status);
    case "running":
      return isRunning(status);
    case "finished":
      return ["done", "stopped", "failed"].includes(taskTone(status));
    default:
      return true;
  }
};

/** The line under a task's name: the site it ran on, or a plain word when the service did not say. */
function TaskWhere({ record }: { record: TaskRecord }) {
  const where = record.url.trim() || record.domain.trim();
  if (where) return <span className="x-ctrow__where x-num">{where}</span>;
  return <span className="x-ctrow__where">The service did not send a site name.</span>;
}

/** The list of computer tasks, straight from the service. Nothing is invented to fill it. */
export function TaskList() {
  const { records, availability, loaded, listError } = useTasks();
  const { kinds, problem: kindsProblem } = useTaskKinds();
  /* with no labels to read, the kind column would be blank on every row: it is left out and said so */
  const showKind = kinds.length > 0;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const query = q.trim().toLowerCase();
  const shown = records.filter(
    (r) => inFilter(filter, r) && (!query || `${r.goal} ${r.url} ${r.domain}`.toLowerCase().includes(query)),
  );

  return (
    <>
      <div className="x-lhd">
        <h1 className="x-title">Computer tasks</h1>
        <PageMenu page="Computer tasks" filters="waiting, running and finished" />
        <ButtonLink variant="primary" href={consoleRoutes.newComputerTask}>
          <Icon name="plus" />
          Start a task
        </ButtonLink>
      </div>
      <p className="x-sub">
        Mimi runs each task on its own hosted browser. You approve the whole task once, then it runs under hard
        guardrails, and you can stop it at any point.
      </p>

      {!USES_API ? (
        <>
          <NotAvailable>
            <p>This build ships without the Mimi service, so there is nothing to run a task on and nothing to show here.</p>
          </NotAvailable>
          <NotYet />
        </>
      ) : !loaded ? (
        <SkeletonRows count={4} className="x-ctskels" />
      ) : availability === "missing" ? (
        <>
          <NotAvailable>
            <p>The service does not have computer tasks yet, so the console has nothing to show.</p>
          </NotAvailable>
          <NotYet />
        </>
      ) : (
        <>
          {listError && (
            <p className="x-ctwarn" role="status">
              <Icon name="triangle-alert" />
              {listError}
            </p>
          )}
          {!showKind && records.length > 0 && (
            <p className="x-ctnote x-ctnote--flat" role="status">
              <Icon name="triangle-alert" />
              {kindsProblem ?? "The task kinds could not be read right now."} The kind of each task is not shown.
            </p>
          )}
          {records.length > 0 && (
            <div className="x-ltools">
              <SearchField label="Search tasks" value={q} onChange={setQ} />
              <Segmented
                label="Task status"
                value={filter}
                onChange={setFilter}
                segments={[
                  { value: "all", label: "All", count: records.length },
                  { value: "waiting", label: "Waiting", count: records.filter((r) => inFilter("waiting", r)).length },
                  { value: "running", label: "Running", count: records.filter((r) => inFilter("running", r)).length },
                  { value: "finished", label: "Finished", count: records.filter((r) => inFilter("finished", r)).length },
                ]}
              />
            </div>
          )}

          {records.length === 0 ? (
            <EmptyState>No computer tasks yet. Start one and it will show up here.</EmptyState>
          ) : shown.length === 0 ? (
            <EmptyState>No tasks match the current filters</EmptyState>
          ) : (
            <Table label="Computer tasks">
              <thead>
                <tr>
                  <th>Task</th>
                  {showKind && <th>Kind</th>}
                  <th>Asked</th>
                  <th>Steps</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="x-ctrow">
                    <td>
                      <Link href={computerTaskHref(r.id)} className="x-ctrow__a">
                        <span className="x-ctrow__t">{taskTitle(r.goal)}</span>
                        <TaskWhere record={r} />
                      </Link>
                    </td>
                    {showKind && <td>{kindLabel(kindOf(r), kinds) ? <Chip>{kindLabel(kindOf(r), kinds)}</Chip> : ""}</td>}
                    <td className="x-num">{r.createdAt ? askedLabel(r.createdAt) : ""}</td>
                    <td className="x-num">{r.stepCount ?? ""}</td>
                    <td>
                      <TaskStatusPill status={statusOf(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <NotYet />
        </>
      )}
    </>
  );
}
