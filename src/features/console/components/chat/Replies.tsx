"use client";

import { tapChip } from "@/features/console/demo/engine";
import { findConversation, useDemo } from "@/features/console/demo/store";

/**
 * Reply chips under the newest helper message: the scripted path through every story.
 * Tapping one types it into the composer, sends it and runs the next step.
 */
export function Replies({ slug }: { slug: string }) {
  const replies = useDemo((s) => findConversation(s, slug)?.replies);
  const busy = useDemo((s) => s.typing?.slug === slug || s.draft?.slug === slug);
  const playing = useDemo((s) => s.playing);
  if (!replies?.length || busy) return null;
  return (
    <div className="mc-rp mc-in" role="group" aria-label="Suggested replies">
      {replies.map((r) => (
        <button
          key={r.label}
          type="button"
          className="mc-rp__c"
          tabIndex={playing ? -1 : undefined}
          aria-disabled={playing || undefined}
          onClick={() => !playing && void tapChip(slug, r)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
