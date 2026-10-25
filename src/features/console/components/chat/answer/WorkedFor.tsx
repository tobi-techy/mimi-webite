"use client";

import { useState } from "react";
import { StepLine, ThoughtBlock } from "@/features/console/components/chat/Work";
import { Icon } from "@/features/console/components/ui/Icon";
import type { WorkLine } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

/** The eight-spoke spark mark that opens a helper's answer. */
export function SparkMark({ className }: { className?: string }) {
  return (
    <svg className={cx("mc-spark", className)} viewBox="0 0 16 16" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M8 1.5v13M1.5 8h13M3.4 3.4l9.2 9.2M12.6 3.4l-9.2 9.2" />
      </g>
    </svg>
  );
}

const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

/**
 * "Worked for 34s" above an answer. When the work lines are kept, it opens to the same reasoning
 * and step lines the live feed shows (collapsed by default, so the answer reads first).
 */
export function WorkedFor({ secs, work, id }: { secs: number; work?: WorkLine[]; id: string }) {
  const [open, setOpen] = useState(false);
  const can = !!work?.length;
  const label = (
    <>
      <SparkMark />
      <span className="mc-wf__t">Worked for {fmt(secs)}</span>
      {can && <span className="mc-wf__k">{work!.length} steps</span>}
      {can && <Icon name="chevron-right" className="i mc-wf__c" />}
    </>
  );
  return (
    <div className={cx("mc-wf", open && "is-open")}>
      {can ? (
        <button type="button" className="mc-wf__h" aria-expanded={open} aria-controls={`wf-${id}`} onClick={() => setOpen(!open)}>
          {label}
        </button>
      ) : (
        <p className="mc-wf__h">{label}</p>
      )}
      {open && can && (
        <div className="mc-wf__b" id={`wf-${id}`}>
          {work!.map((w) => (w.kind === "thought" ? <ThoughtBlock key={w.id} m={w} /> : <StepLine key={w.id} m={w} />))}
        </div>
      )}
    </div>
  );
}
