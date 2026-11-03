import { StatusPill, type Status } from "@/features/console/components/ui/StatusPill";
import { taskShortWord, taskTone, type TaskTone } from "@/features/console/lib/computer-tasks";

const TONE_STATUS: Record<TaskTone, Status> = {
  proposed: "awaiting",
  running: "running",
  done: "paid",
  stopped: "skipped",
  failed: "failed",
  unknown: "skipped",
};

/** One task's status, with the console's own pill so it reads the same as every other status. */
export function TaskStatusPill({ status, className }: { status: string | null | undefined; className?: string }) {
  return (
    <StatusPill status={TONE_STATUS[taskTone(status)]} className={className}>
      {taskShortWord(status)}
    </StatusPill>
  );
}
