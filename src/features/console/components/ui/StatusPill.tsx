import type { ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { cx } from "@/lib/cx";

/**
 * v2 status pill: every status has its own icon, a soft tint and darker text, so it reads at a
 * glance without relying on colour alone. Four tints only (paid green, partial sand, overdue
 * orange, failed red); everything else stays neutral grey.
 */
export type Status =
  | "paid"
  | "verified"
  | "partial"
  | "overdue"
  | "failed"
  | "fake"
  | "awaiting"
  | "queued"
  | "upcoming"
  | "self"
  | "sent"
  | "skipped"
  | "running";

type Tone = "green" | "sand" | "orange" | "red" | "neutral";

const STATUS: Record<Status, { icon: IconName; tone: Tone; label: string }> = {
  paid: { icon: "circle-check", tone: "green", label: "Paid" },
  verified: { icon: "shield-check", tone: "green", label: "Verified" },
  sent: { icon: "circle-check", tone: "green", label: "Sent" },
  partial: { icon: "circle-half", tone: "sand", label: "Partial" },
  overdue: { icon: "clock", tone: "orange", label: "Overdue" },
  failed: { icon: "circle-x", tone: "red", label: "Failed" },
  fake: { icon: "triangle-alert", tone: "red", label: "Fake alert" },
  awaiting: { icon: "hand", tone: "neutral", label: "Needs you" },
  queued: { icon: "circle-pause", tone: "neutral", label: "Queued" },
  upcoming: { icon: "calendar", tone: "neutral", label: "Upcoming" },
  self: { icon: "circle-dashed", tone: "neutral", label: "Self-reported" },
  skipped: { icon: "circle-dashed", tone: "neutral", label: "Skipped" },
  running: { icon: "refresh-cw", tone: "neutral", label: "Running" },
};

export const statusKeys = Object.keys(STATUS) as Status[];

export function StatusPill({
  status,
  children,
  className,
}: {
  status: Status;
  children?: ReactNode;
  className?: string;
}) {
  const s = STATUS[status];
  return (
    <span className={cx("v2-pill", `v2-pill--${s.tone}`, className)}>
      <Icon name={s.icon} />
      {children ?? s.label}
    </span>
  );
}
