"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { MessageFeed } from "@/features/console/components/chat/Messages";
import { Icon } from "@/features/console/components/ui/Icon";
import { StatusPill, type Status } from "@/features/console/components/ui/StatusPill";
import { memoryFor, rulesFor, type MemoryNote } from "@/features/console/content/memory";
import { pauseRun } from "@/features/console/demo/engine";
import { runningIn } from "@/features/console/demo/roster";
import { findConversation, useDemo } from "@/features/console/demo/store";
import type { Conversation } from "@/features/console/demo/types";
import {
  STEER_EVENT,
  finishLine,
  stepLine,
  taskState,
  taskStateLabel,
  updatedBy,
} from "@/features/console/lib/thread-view";
import { cx } from "@/lib/cx";

/**
 * Quiet sheets (Tobi, 29 Oct 2026: "don't fully hide work", then "clean wins"). Steps, a task's own
 * thread and "What I remember" open from the header and the thread; nothing here shows by default.
 * Factory only: the plan sheet's surface, hairlines, muted Geist text, Geist Mono labels, one
 * action per row, #ee6018 only as the running mark.
 */

/** Asks the composer to steer the current task (it shows "Steering: <task>" and takes focus). */
export function steerComposer(slug: string, task: string) {
  window.dispatchEvent(new CustomEvent(STEER_EVENT, { detail: { slug, task } }));
}

function Sheet({
  label,
  title,
  sub,
  status,
  rules,
  onClose,
  children,
}: {
  label: string;
  title: string;
  sub?: string;
  /** v2: a status pill shown above the title instead of the mono label line. */
  status?: ReactNode;
  /** Round 2: the task's standing rules as one quiet line in the header (no chip band). */
  rules?: readonly string[];
  onClose: () => void;
  children: ReactNode;
}) {
  const close = useRef<HTMLButtonElement>(null);
  const done = useRef(onClose);
  useEffect(() => {
    done.current = onClose;
  });
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    close.current?.focus({ preventScroll: true });
    const esc = (e: KeyboardEvent) => e.key === "Escape" && done.current();
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("keydown", esc);
      back?.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <>
      <div className="mc-sheetbg" aria-hidden="true" onClick={onClose} />
      <div className="mc-sheet mc-qsh" role="dialog" aria-modal="true" aria-label={`${label}: ${title}`}>
        <span className="mc-sheet__grab" aria-hidden="true" />
        <div className="mc-qsh__h">
          <div>
            {status ?? <p className="mc-qsh__l">{label}</p>}
            <p className="mc-qsh__t">{title}</p>
            {sub && <p className="mc-qsh__s">{sub}</p>}
            {rules && (
              <p className="mc-qsh__s v2-rules-line" aria-label="Rules this task always follows">
                Always:{" "}
                {rules.map((r, i) => (
                  <Fragment key={r}>
                    {i > 0 && " "}
                    <span>{i > 0 ? `· ${r}` : r}</span>
                  </Fragment>
                ))}
              </p>
            )}
          </div>
          <button ref={close} type="button" className="mc-qsh__x v2-x" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

const WORD: Record<string, string> = {
  run: "Running",
  done: "Done",
  wait: "Waiting on you",
  failed: "Failed",
};

/** The current task's steps, one line each, then Pause and Steer (one action per row). */
export function StepsSheet({ slug, onClose }: { slug: string; onClose: () => void }) {
  const conv = useDemo((s) => findConversation(s, slug));
  const running = useDemo((s) => {
    const c = findConversation(s, slug);
    return !!c && runningIn(s, c);
  });
  if (!conv) return null;
  const lines: { id: string; text: string; state: string }[] = [];
  for (const m of conv.messages) {
    if (m.kind === "step") lines.push({ id: m.id, text: stepLine(m.text), state: m.state });
    else if (m.kind === "thought" && m.live)
      lines.push({ id: m.id, text: "Thinking it through", state: "run" });
  }
  if (!lines.length && conv.plan)
    conv.plan.items.forEach((it, i) =>
      lines.push({ id: `p${i}`, text: stepLine(it.label), state: it.state === "todo" ? "todo" : it.state }),
    );
  return (
    <Sheet
      label="Steps"
      title={conv.title}
      sub={`${conv.helper} · ${running ? "working now" : conv.status || "idle"}`}
      onClose={onClose}
    >
      <div className="mc-qsh__b">
        {lines.length ? (
          <ol className="mc-qsh__list">
            {lines.map((l) => (
              <li key={l.id} className={cx("mc-qsh__r", `is-${l.state}`)}>
                <span className="mc-qsh__tx">{l.text}</span>
                <span className="mc-qsh__st">{WORD[l.state] ?? "Next"}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mc-qsh__none">No steps on this task yet.</p>
        )}
      </div>
      <div className="mc-qsh__acts">
        {running && (
          <button
            type="button"
            className="mc-qsh__a"
            onClick={() => {
              pauseRun(slug);
              onClose();
            }}
          >
            Pause
            <small>Stop after this step</small>
          </button>
        )}
        <button
          type="button"
          className="mc-qsh__a"
          onClick={() => {
            onClose();
            steerComposer(slug, conv.title);
          }}
        >
          Steer
          <small>Tell {conv.helper} what to change</small>
        </button>
      </div>
    </Sheet>
  );
}

/** One task's own thread (fresh context): pinned rules that never scroll away, then that task's messages. */
export function TaskSheet({ c, onClose }: { c: Conversation; onClose: () => void }) {
  const typing = useDemo((s) => (s.typing?.slug === c.slug ? s.typing.who : null));
  const rest = c.messages[0]?.kind === "date" ? c.messages.slice(1) : c.messages;
  const rules = rulesFor(c.helper);
  const by = updatedBy(c);
  return (
    <Sheet
      label={`Task · ${taskWord(c)}`}
      status={<TaskPill c={c} />}
      title={c.title}
      sub={by ? `Updated by ${by} · ${c.ago}` : undefined}
      rules={rules.length > 0 ? rules : undefined}
      onClose={onClose}
    >
      <div className="mc-qsh__b mc-qsh__feed">
        <div className="mc-fi mc-qsh__fi">
          <MessageFeed slug={c.slug} messages={rest} typing={typing} />
        </div>
      </div>
    </Sheet>
  );
}

const TASK_PILL: Record<ReturnType<typeof taskState>, Status> = {
  working: "running",
  waiting: "queued",
  needs: "awaiting",
  stuck: "failed",
  done: "sent",
  idle: "queued",
};

/** v2: the task's state as one status pill ("Done · Check needed" reads as Partial). */
function TaskPill({ c }: { c: Conversation }) {
  const st = taskState(c);
  const fin = finishLine(st, c.proof);
  if (st === "done" && !c.proof?.trim()) return <StatusPill status="partial">Done · {fin}</StatusPill>;
  return <StatusPill status={TASK_PILL[st]}>{fin ? `${taskStateLabel[st]} · ${fin}` : taskStateLabel[st]}</StatusPill>;
}

/** "running", "needs you", "stuck", or "done · <proof>" ("done · check needed" without proof). */
export const taskWord = (c: Pick<Conversation, "state" | "messages" | "proof">) => {
  const st = taskState(c);
  const fin = finishLine(st, c.proof);
  return fin ? `${taskStateLabel[st]} · ${fin}` : taskStateLabel[st];
};

/** What the helper remembers about the business: each note edits in place; Forget lives in edit. */
export function MemorySheet({ helper, onClose }: { helper: string; onClose: () => void }) {
  const [list, setList] = useState<MemoryNote[]>(() => memoryFor(helper));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const save = () => {
    const t = draft.trim();
    if (editing && t) setList((l) => l.map((n) => (n.id === editing ? { ...n, text: t } : n)));
    setEditing(null);
  };
  return (
    <Sheet
      label="What I remember"
      title={helper}
      sub="Notes I use on every task. Change or forget any of them."
      onClose={onClose}
    >
      <div className="mc-qsh__b">
        {list.length ? (
          <ul className="mc-qsh__list">
            {list.map((n) =>
              editing === n.id ? (
                <li key={n.id} className="mc-qsh__r mc-qsh__r--edit">
                  <input
                    className="mc-qsh__in"
                    aria-label="Edit note"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") save();
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditing(null);
                      }
                    }}
                    onBlur={(e) => {
                      if (!(e.relatedTarget as Element | null)?.closest?.(".mc-qsh__fg")) save();
                    }}
                  />
                  <button
                    type="button"
                    className="mc-qsh__rb mc-qsh__fg"
                    onClick={() => {
                      setList((l) => l.filter((x) => x.id !== n.id));
                      setEditing(null);
                    }}
                  >
                    Forget
                  </button>
                </li>
              ) : (
                <li key={n.id} className="mc-qsh__r">
                  <span className="mc-qsh__tx">{n.text}</span>
                  <button
                    type="button"
                    className="mc-qsh__rb"
                    aria-label={`Edit: ${n.text}`}
                    onClick={() => {
                      setEditing(n.id);
                      setDraft(n.text);
                    }}
                  >
                    Edit
                  </button>
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className="mc-qsh__none">Nothing saved. {helper} starts fresh on every task.</p>
        )}
      </div>
    </Sheet>
  );
}
