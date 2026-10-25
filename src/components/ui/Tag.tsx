import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export type AgentStatus = "live" | "next" | "later";

/** Agent availability tag: "In pilot" (live, orange dot), "Next", "Later". */
export function StatusTag({ status, children }: { status: AgentStatus; children: ReactNode }) {
  return (
    <span
      className={cx(
        "x-status",
        status === "live" && "x-status--live",
        status === "later" && "x-status--later",
      )}
    >
      {children}
    </span>
  );
}

/** Verification chip (`.x-vchip`): neutral, ok (verified/paid) or warn (flagged). */
export function Chip({
  tone,
  className,
  hidden,
  children,
}: {
  tone?: "ok" | "warn";
  className?: string;
  /** Hidden from assistive tech (the "before" state of an animated swap). */
  hidden?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cx("x-vchip", tone === "ok" && "is-ok", tone === "warn" && "is-warn", className)}
      aria-hidden={hidden ? "true" : undefined}
    >
      {children}
    </span>
  );
}

/** Tabular mono figure (`.x-num`). */
export function Stat({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("x-num", className)}>{children}</span>;
}
