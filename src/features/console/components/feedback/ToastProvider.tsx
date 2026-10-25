"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import { ToastContext } from "@/features/console/hooks/use-toast";
import { cx } from "@/lib/cx";

const TOAST_MS = 2400;

/** Provides `useToast()` and renders the single live toast (`.x-toast`, role=status). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [on, setOn] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const say = useCallback((m: string) => {
    setMessage(m);
    setOn(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOn(false), TOAST_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext value={say}>
      {children}
      <div className={cx("x-toast", on && "is-on")} role="status" aria-live="polite">
        <Icon name="check" />
        <span>{message}</span>
      </div>
    </ToastContext>
  );
}
