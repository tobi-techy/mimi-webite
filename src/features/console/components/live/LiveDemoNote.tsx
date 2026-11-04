"use client";

import { liveReset } from "@/features/console/api/actions";
import { useLive } from "@/features/console/api/live-store";
import { retryLive } from "@/features/console/api/sync";
import { Button } from "@/features/console/components/ui/Button";
import { Note } from "@/features/console/components/ui/Note";

/**
 * At the top of Mimi's conversation in the API build: what this is (a sandbox: the same console
 * and API as production, on a sample distributor's data), the newest notice (budget used, paused,
 * session renewed) and Reset. When Mimi can't be reached it says so and offers Retry; no sample
 * data stands in. Renders nothing in the sample build.
 */
export function LiveDemoNote() {
  const status = useLive((s) => s.status);
  const notice = useLive((s) => s.notice);
  if (status === "off" || status === "connecting") return null;
  if (status === "fallback")
    return (
      <Note>
        <span>{notice?.text ?? "Mimi can't be reached right now."}</span>
        <Button size="sm" variant="ghost" onClick={() => void retryLive()}>
          Retry
        </Button>
      </Note>
    );
  const warn = notice && notice.kind !== "info" ? notice.text : null;
  return (
    <Note>
      <span>
        {/* one word, not the explainer sentence (copy cut, 4 Nov): the footer and the reset say the rest */}
        {warn ?? "Sandbox"}
      </span>
      <Button size="sm" variant="ghost" onClick={() => void liveReset()}>
        Reset sandbox
      </Button>
    </Note>
  );
}
