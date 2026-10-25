"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { sfx } from "@/lib/sound";

/** Small mono button that copies `text` and confirms for a moment. */
export function CopyButton({
  text,
  label = "Copy",
  className,
  children,
}: {
  text: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      sfx("copy", "success", { emphasis: "subtle" });
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  return (
    <button type="button" className={cx("x-copy", done && "is-done", className)} onClick={copy}>
      {children}
      <span className="x-copy__lbl" aria-live="polite">
        {done ? "Copied" : label}
      </span>
    </button>
  );
}
