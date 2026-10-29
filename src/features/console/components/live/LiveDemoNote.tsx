"use client";

import { liveReset } from "@/features/console/api/actions";
import { useLive } from "@/features/console/api/live-store";
import { Button } from "@/features/console/components/ui/Button";
import { Note } from "@/features/console/components/ui/Note";

/**
 * At the top of Mimi's conversation in the demo build: what this is, the newest notice (budget
 * used, demo paused, session renewed) and a small Reset. Renders nothing in the sample build.
 */
export function LiveDemoNote() {
  const status = useLive((s) => s.status);
  const notice = useLive((s) => s.notice);
  if (status === "off" || status === "connecting") return null;
  if (status === "fallback") return <Note>{notice?.text ?? "Mimi can't be reached right now, so you're seeing sample data."}</Note>;
  const warn = notice && notice.kind !== "info" ? notice.text : null;
  return (
    <Note>
      <span>{warn ?? "Live demo: your own copy of Coral Lane Trading, a made-up business."}</span>
      <Button size="sm" variant="ghost" onClick={() => void liveReset()}>
        Reset demo
      </Button>
    </Note>
  );
}
