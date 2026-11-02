"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastAction } from "@/features/console/hooks/use-toast";
import { cx } from "@/lib/cx";

const TOAST_MS = 2400;
/* long enough to read the line and reach Undo */
const ACTION_MS = 8000;

/** Provides `useToast()` and renders the single live toast (`.x-toast`, role=status), with an optional button. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<ToastAction | null>(null);
  const [on, setOn] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const say = useCallback((m: string, a?: ToastAction) => {
    setMessage(m);
    setAction(a ?? null);
    setOn(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOn(false), a ? ACTION_MS : TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext value={say}>
      {children}
      <div className={cx("x-toast", on && "is-on", action && "has-act")} role="status" aria-live="polite">
        {/* no tick: a toast is as often a notice ("come back tomorrow") as a confirmation */}
        <span>{message}</span>
        {action && on && (
          <button
            type="button"
            className="x-toast__act"
            onClick={() => {
              window.clearTimeout(timer.current);
              setOn(false);
              action.run();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </ToastContext>
  );
}
