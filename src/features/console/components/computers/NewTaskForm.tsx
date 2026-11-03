"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createTask } from "@/features/console/api/computer-tasks";
import { USES_API } from "@/features/console/api/config";
import { NotAvailable, NotYet } from "@/features/console/components/computers/NotAvailable";
import { SkeletonRows } from "@/features/console/components/live/Skeleton";
import { Button, ButtonLink } from "@/features/console/components/ui/Button";
import { Icon } from "@/features/console/components/ui/Icon";
import { computerTaskHref, consoleRoutes } from "@/features/console/config";
import { useTaskKinds, useTasks } from "@/features/console/hooks/use-computer-tasks";
import { useToast } from "@/features/console/hooks/use-toast";
import { cx } from "@/lib/cx";
import { deriveDomain, MAX_GOAL, validateNewTask } from "@/features/console/lib/computer-tasks";

/**
 * Asking for a new task: what kind of task it is, what it should do, and the page to start on. Mimi
 * plans the steps first and nothing runs until the owner approves the task on its own screen.
 *
 * The kinds, and their labels, are read from the service (`GET /v1/computer/kinds`) rather than
 * listed here, so the two cannot drift apart. When the service has not listed any, the form says so
 * and no task is sent: a kind the console made up is worse than a form that waits.
 */
export function NewTaskForm() {
  const router = useRouter();
  const say = useToast();
  const { availability } = useTasks();
  const kindsState = useTaskKinds();
  const kinds = kindsState.kinds;
  const [kind, setKind] = useState("");
  const [goal, setGoal] = useState("");
  const [url, setUrl] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const domain = deriveDomain(url);

  if (!USES_API || availability === "missing") {
    return (
      <>
        <h1 className="x-title">Start a computer task</h1>
        <NotAvailable>
          <p>The service does not have computer tasks yet, so a task cannot be planned or run from here.</p>
        </NotAvailable>
        <NotYet />
      </>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bad = validateNewTask({ kind, goal, url });
    if (bad) {
      setProblem(bad);
      return;
    }
    setProblem(null);
    setBusy(true);
    const res = await createTask({ kind, goal: goal.trim(), url: url.trim(), domain: deriveDomain(url) });
    setBusy(false);
    if (!res.ok) {
      setProblem(res.message);
      return;
    }
    say("Task planned. Check the steps, then approve it.");
    router.push(computerTaskHref(res.id));
  }

  return (
    <>
      <div className="x-lhd">
        <h1 className="x-title">Start a computer task</h1>
        <ButtonLink variant="ghost" href={consoleRoutes.computers}>
          <Icon name="chevron-left" />
          All tasks
        </ButtonLink>
      </div>
      <p className="x-sub">
        Mimi works out the steps first and shows them to you. Nothing runs on the computer until you approve the
        whole task.
      </p>

      <form className="x-ctform" onSubmit={(e) => void onSubmit(e)}>
        <fieldset className="x-ctfield">
          <legend className="x-af__l">What kind of task is it?</legend>
          {kindsState.loading ? (
            <SkeletonRows count={2} className="x-ctskels" />
          ) : kinds.length === 0 ? (
            <p className="x-af__h" role="status">
              {kindsState.problem ?? "The service has not listed any task kinds yet."} A task cannot be planned until
              it does.
            </p>
          ) : (
            <div className="x-aseg x-ctkinds">
              {kinds.map((k) => (
                <button
                  key={k.kind}
                  type="button"
                  className={cx("x-ach2", kind === k.kind && "is-on")}
                  aria-pressed={kind === k.kind}
                  onClick={() => setKind(k.kind)}
                >
                  <Icon name="monitor" />
                  <span>
                    <b>{k.label || k.kind}</b>
                  </span>
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="x-af">
          <label className="x-af__l" htmlFor="ct-goal">
            What should the task do?
          </label>
          <textarea
            id="ct-goal"
            className="x-ain x-ain--ta"
            value={goal}
            maxLength={MAX_GOAL}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Read today's statement and note every transfer that came in"
          />
          <p className="x-af__h">Plain words are fine. Mimi turns them into steps you can read.</p>
        </div>

        <div className="x-af">
          <label className="x-af__l" htmlFor="ct-url">
            Where should it start?
          </label>
          <input
            id="ct-url"
            className="x-ain x-ain--code"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ibank.providusbank.com"
          />
          <p className="x-af__h">
            {domain ? `Site: ${domain}` : "The page the browser should open first, starting with https:// or http://."}
          </p>
        </div>

        {problem && (
          <p className="x-ctwarn" role="status">
            <Icon name="triangle-alert" />
            {problem}
          </p>
        )}

        <div className="x-ctform__a">
          <Button variant="primary" type="submit" disabled={busy || kinds.length === 0}>
            {busy ? "Planning" : "Ask Mimi to plan it"}
          </Button>
          <ButtonLink variant="ghost" href={consoleRoutes.computers}>
            Cancel
          </ButtonLink>
        </div>
      </form>

      <NotYet />
    </>
  );
}
