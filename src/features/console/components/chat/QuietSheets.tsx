"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MessageFeed } from "@/features/console/components/chat/Messages";
import { memoryFor, type MemoryNote } from "@/features/console/content/memory";
import { pauseRun } from "@/features/console/demo/engine";
import { runningIn } from "@/features/console/demo/roster";
import { findConversation, useDemo } from "@/features/console/demo/store";
import type { Conversation } from "@/features/console/demo/types";
import { STEER_EVENT, stepLine } from "@/features/console/lib/thread-view";
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

function Sheet({ label, title, sub, onClose, children }: { label: string; title: string; sub?: string; onClose: () => void; children: ReactNode }) {
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
      <div className="mc-sheet mc-qs" role="dialog" aria-modal="true" aria-label={`${label}: ${title}`}>
        <span className="mc-sheet__grab" aria-hidden="true" />
        <div className="mc-qs__h">
          <div>
            <p className="mc-qs__l">{label}</p>
            <p className="mc-qs__t">{title}</p>
            {sub && <p className="mc-qs__s">{sub}</p>}
          </div>
          <button ref={close} type="button" className="mc-qs__x" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

const WORD: Record<string, string> = { run: "Running", done: "Done", wait: "Waiting on you", failed: "Failed" };

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
    else if (m.kind === "thought" && m.live) lines.push({ id: m.id, text: "Thinking it through", state: "run" });
  }
  if (!lines.length && conv.plan) conv.plan.items.forEach((it, i) => lines.push({ id: `p${i}`, text: stepLine(it.label), state: it.state === "todo" ? "todo" : it.state }));
  return (
    <Sheet label="Steps" title={conv.title} sub={`${conv.helper} · ${running ? "working now" : conv.status || "idle"}`} onClose={onClose}>
      <div className="mc-qs__b">
        {lines.length ? (
          <ol className="mc-qs__list">
            {lines.map((l) => (
              <li key={l.id} className={cx("mc-qs__r", `is-${l.state}`)}>
                <span className="mc-qs__tx">{l.text}</span>
                <span className="mc-qs__st">{WORD[l.state] ?? "Next"}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mc-qs__none">No steps on this task yet.</p>
        )}
      </div>
      <div className="mc-qs__acts">
        {running && (
          <button
            type="button"
            className="mc-qs__a"
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
          className="mc-qs__a"
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

/** One task's own thread (fresh context): just that task's messages. */
export function TaskSheet({ c, onClose }: { c: Conversation; onClose: () => void }) {
  const typing = useDemo((s) => (s.typing?.slug === c.slug ? s.typing.who : null));
  const rest = c.messages[0]?.kind === "date" ? c.messages.slice(1) : c.messages;
  return (
    <Sheet label={`Task · ${taskWord(c)}`} title={c.title} sub={`${c.helper} · ${c.code}`} onClose={onClose}>
      <div className="mc-qs__b mc-qs__feed">
        <div className="mc-fi mc-qs__fi">
          <MessageFeed slug={c.slug} messages={rest} typing={typing} />
        </div>
      </div>
    </Sheet>
  );
}

export const taskWord = (c: Pick<Conversation, "state">) =>
  c.state === "run" ? "running" : c.state === "needs" ? "needs you" : c.state === "done" ? "done" : "idle";

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
    <Sheet label="What I remember" title={helper} sub="Notes I use on every task. Change or forget any of them." onClose={onClose}>
      <div className="mc-qs__b">
        {list.length ? (
          <ul className="mc-qs__list">
            {list.map((n) =>
              editing === n.id ? (
                <li key={n.id} className="mc-qs__r mc-qs__r--edit">
                  <input
                    className="mc-qs__in"
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
                      if (!(e.relatedTarget as Element | null)?.closest?.(".mc-qs__fg")) save();
                    }}
                  />
                  <button
                    type="button"
                    className="mc-qs__rb mc-qs__fg"
                    onClick={() => {
                      setList((l) => l.filter((x) => x.id !== n.id));
                      setEditing(null);
                    }}
                  >
                    Forget
                  </button>
                </li>
              ) : (
                <li key={n.id} className="mc-qs__r">
                  <span className="mc-qs__tx">{n.text}</span>
                  <button
                    type="button"
                    className="mc-qs__rb"
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
          <p className="mc-qs__none">Nothing saved. {helper} starts fresh on every task.</p>
        )}
      </div>
    </Sheet>
  );
}
