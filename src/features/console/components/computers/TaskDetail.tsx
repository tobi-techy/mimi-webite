"use client";

import Link from "next/link";
import { useState } from "react";
import { approveTask, loadTask, stopTask } from "@/features/console/api/computer-tasks";
import { USES_API } from "@/features/console/api/config";
import { NotAvailable, NotYet } from "@/features/console/components/computers/NotAvailable";
import { TaskFile } from "@/features/console/components/computers/TaskFile";
import { TaskScreenshot } from "@/features/console/components/computers/TaskScreenshot";
import { TaskStatusPill } from "@/features/console/components/computers/TaskStatusPill";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { Button } from "@/features/console/components/ui/Button";
import { Chip } from "@/features/console/components/ui/Chip";
import { Icon } from "@/features/console/components/ui/Icon";
import { consoleRoutes } from "@/features/console/config";
import { useComputerTask, useTaskKinds } from "@/features/console/hooks/use-computer-tasks";
import { useToast } from "@/features/console/hooks/use-toast";
import {
  describeStop,
  isRunning,
  kindLabel,
  liveViewLink,
  needsOwner,
  needsSignIn,
  normalizeArtifacts,
  planOf,
  stepNote,
  stepSentence,
  stepsOf,
  taskStateWord,
  taskShortWord,
  taskTitle,
} from "@/features/console/lib/computer-tasks";

function Crumbs({ title }: { title: string }) {
  return (
    <nav className="x-acr" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link href={consoleRoutes.computers}>Computer tasks</Link>
          <Icon name="chevron-right" className="x-acr__s" />
        </li>
        <li>
          <span aria-current="page">{title}</span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * One computer task: what it plans, every step the computer took (with its screenshot), and the
 * files it left behind. The owner approves the whole task once and can stop it while it runs.
 */
export function TaskDetail({ id }: { id: string }) {
  const { record, loading, availability } = useComputerTask(id);
  const say = useToast();
  const { kinds } = useTaskKinds();
  const [busy, setBusy] = useState<"approve" | "stop" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  if (!id) {
    return (
      <NotAvailable>
        <p>No task was chosen. Open one from the list.</p>
      </NotAvailable>
    );
  }

  const title = taskTitle(record?.goal);
  /* the breadcrumb names the kind, so the goal is not read twice on the page */
  const crumbKind = record?.kind ?? record?.task?.kind ?? null;
  const crumb = kindLabel(crumbKind, kinds);
  const crumbText = crumb || "Task";

  const unavailable = (
    <>
      <Crumbs title={crumbText} />
      <NotAvailable>
        <p>The service does not have computer tasks yet, so there is nothing to show for this one.</p>
      </NotAvailable>
      <NotYet />
    </>
  );

  if (!USES_API || availability === "missing") return unavailable;
  if (!record || loading) {
    return (
      <>
        <Crumbs title={crumbText} />
        <SkeletonRows count={5} className="x-ctskels" />
      </>
    );
  }

  const task = record.task;
  if (!task && record.state === "error") {
    return (
      <>
        <Crumbs title={crumbText} />
        <p className="x-ctwarn" role="status">
          <Icon name="triangle-alert" />
          {record.error ?? "This task could not be read."}
        </p>
        <div className="x-ctacts">
          <Button onClick={() => void loadTask(id)}>
            <Icon name="refresh-cw" />
            Try again
          </Button>
        </div>
      </>
    );
  }

  const steps = stepsOf(task);
  const plan = planOf(task);
  const artifacts = normalizeArtifacts(task?.artifacts);
  const stopped = describeStop(task?.stop_reason ?? record.stopReason);
  const status = task?.status ?? record.status;
  const kind = record.kind ?? task?.kind ?? null;
  const waiting = needsOwner(status);
  const running = isRunning(status);
  const signIn = needsSignIn(status);
  const kindWord = kindLabel(kind, kinds);
  /* the pill carries the short word already, so the fuller sentence shows only when it says more */
  const stateWord = taskStateWord(status);
  const pillWord = taskShortWord(status);
  const live = liveViewLink(task);

  async function onApprove() {
    setProblem(null);
    setBusy("approve");
    const res = await approveTask(id);
    setBusy(null);
    if (!res.ok) {
      setProblem(res.message);
      say(res.message);
      return;
    }
    say("Task approved. It is running on its own browser now.");
  }

  async function onStop() {
    setProblem(null);
    setBusy("stop");
    const res = await stopTask(id);
    setBusy(null);
    if (!res.ok) {
      setProblem(res.message);
      say(res.message);
      return;
    }
    say("Task stopped.");
  }

  return (
    <>
      <Crumbs title={crumbText} />

      <div className="x-ctdh">
        <div className="x-ctdh__t">
          <h1>{title}</h1>
          <p className="x-ctdh__m">
            <TaskStatusPill status={status} />
            {stateWord !== pillWord && <span>{stateWord}</span>}
            {kindWord && <Chip>{kindWord}</Chip>}
          </p>
          {record.url.trim() ? (
            <p className="x-ctdh__w x-num">Starts at {record.url.trim()}</p>
          ) : record.domain.trim() ? (
            <p className="x-ctdh__w x-num">Site: {record.domain.trim()}</p>
          ) : null}
        </div>
        <div className="x-ctacts">
          {waiting && (
            <Button variant="primary" onClick={() => void onApprove()} disabled={busy !== null}>
              {busy === "approve" ? "Approving" : "Approve and run"}
            </Button>
          )}
          {running && (
            <Button onClick={() => void onStop()} disabled={busy !== null}>
              {busy === "stop" ? "Stopping" : "Stop"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => void loadTask(id)} disabled={busy !== null}>
            <Icon name="refresh-cw" />
            Refresh
          </Button>
        </div>
      </div>

      {problem && (
        <p className="x-ctwarn" role="status">
          <Icon name="triangle-alert" />
          {problem}
        </p>
      )}
      {!signIn && stopped && (
        <p className="x-ctwarn" role="status">
          <Icon name="circle-pause" />
          Stopped: {stopped}
        </p>
      )}
      {signIn && (
        <p className="x-ctnote">
          <Icon name="monitor" />
          Stopped at a sign-in. It is waiting for you and it kept its browser open, so you can sign in from the live
          view below.
        </p>
      )}
      {waiting && (
        <p className="x-ctnote">
          <Icon name="shield-check" />
          Approving runs the whole task. The computer stops itself at anything it is not allowed to do, such as a
          login, a payment or a bank change.
        </p>
      )}

      <div className="x-ctcols">
        <section className="x-adsec">
          <h2>
            Steps <span>{steps.length > 0 ? steps.length : ""}</span>
          </h2>
          <p className="x-ctnote x-ctnote--flat">
            <Icon name="camera" />
            Each step keeps the screenshot the computer took at that moment.
          </p>
          {live ? (
            <p className="x-ctnote x-ctnote--flat">
              <Icon name="monitor" />
              <a className="x-ctlive" href={live} target="_blank" rel="noreferrer noopener">
                Watch live
              </a>{" "}
              A live view of the browser. The link stops working when the task ends.
            </p>
          ) : (
            <p className="x-ctnote x-ctnote--flat">
              <Icon name="monitor" />
              There is no live view of this task right now.
            </p>
          )}
          {steps.length === 0 ? (
            <p className="x-ctempty">
              {waiting ? "No steps yet. Approve the task and the log will fill in." : "No steps yet."}
            </p>
          ) : (
            <ol className="x-ctsteps">
              {steps.map((step, i) => (
                <li key={`${step.index}-${i}`}>
                  <div className="x-ctstep__n x-num">{step.index}</div>
                  <div className="x-ctstep__b">
                    <p className="x-ctstep__a">{stepSentence(step)}</p>
                    {stepNote(step) && <p className="x-ctstep__nt">{stepNote(step)}</p>}
                    <TaskScreenshot taskId={id} source={step.screenshot} alt={`Screenshot of step ${step.index}`} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="x-ctside">
          {plan.length > 0 && (
            <section className="x-adsec">
              <h2>What it plans to do</h2>
              <ol className="x-ctplan">
                {plan.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </section>
          )}
          <section className="x-adsec">
            <h2>Files</h2>
            {artifacts.length === 0 ? (
              <p className="x-ctempty">No files from this task.</p>
            ) : (
              <ul className="x-ctfiles">
                {artifacts.map((a, i) => (
                  <li key={`${a.label}-${i}`}>
                    {a.href ? (
                      <span className="x-ctfile">
                        <Icon name="file-text" />
                        <span className="x-ctfile__n">{a.label}</span>
                        <a href={a.href} target="_blank" rel="noreferrer noopener">
                          Open it
                        </a>
                      </span>
                    ) : a.file ? (
                      <TaskFile taskId={id} name={a.file} label={a.label} />
                    ) : (
                      <span className="x-ctfile">
                        <Icon name="file-text" />
                        <span className="x-ctfile__n">{a.label}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <NotYet />
    </>
  );
}
