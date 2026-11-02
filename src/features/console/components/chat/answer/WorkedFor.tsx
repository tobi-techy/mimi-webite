"use client";

import { useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import type { WorkLine } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

/** The eight-spoke spark mark (kept for callers outside answers). */
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
const clock = (t: number) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
/** Strip the light markdown steps carry (**bold**) for the quiet activity rows. */
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1");

/**
 * v2 steps block (Muse's three status layers, Grok's "hover/open for the current action"): one quiet
 * line above the answer, "6 steps · 34s", that opens into an activity list. Each row is an icon
 * tile, the step in plain words, and the time on the right; handoffs show the two helper faces;
 * a step that waits on you is the only one with emphasis. Reasoning text is never shown here.
 */
export function WorkedFor({ secs, work, id }: { secs: number; work?: WorkLine[]; id: string }) {
  const [open, setOpen] = useState(false);
  const steps = (work ?? []).filter((w) => w.kind === "step");
  const can = steps.length > 0;
  const label = (
    <>
      <Icon name="list-checks" className="i v2-wf__i" />
      <span>
        {can ? `${steps.length} steps` : "Worked"} · {fmt(secs)}
      </span>
      {can && <Icon name="chevron-down" className="i v2-wf__c" />}
    </>
  );
  return (
    <div className={cx("mc-wf v2-wf", open && "is-open")}>
      {can ? (
        <button
          type="button"
          className="v2-wf__h"
          aria-expanded={open}
          aria-controls={`wf-${id}`}
          onClick={() => setOpen(!open)}
        >
          {label}
        </button>
      ) : (
        <p className="v2-wf__h">{label}</p>
      )}
      {open && can && (
        <ol className="v2-act" id={`wf-${id}`}>
          {steps.map((w) => {
            if (w.kind !== "step") return null;
            const icon: IconName =
              w.variant === "error"
                ? "circle-x"
                : w.variant === "retry"
                  ? "refresh-cw"
                  : w.variant === "gate"
                    ? "hand"
                    : ((w.icon ?? "check") as IconName);
            return (
              <li key={w.id} className={cx(`is-${w.state}`, w.variant === "gate" && "is-gate")}>
                <span className="v2-act__ico" aria-hidden="true">
                  {w.variant === "handoff" && w.to ? (
                    <>
                      <HelperFace name={w.from} size={14} />
                      <HelperFace name={w.to} size={14} />
                    </>
                  ) : (
                    <Icon name={icon} />
                  )}
                </span>
                <span className="v2-act__t">
                  {plain(w.text)}
                  {(w.took || w.meta) && <small>{w.took ?? w.meta?.replace(/^·\s*/, "")}</small>}
                </span>
                <time>{clock(w.at)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
