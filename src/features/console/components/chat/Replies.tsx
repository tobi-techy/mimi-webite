"use client";

import { useRouter } from "next/navigation";
import { isApiThread, liveSend } from "@/features/console/api/actions";
import { tapChip } from "@/features/console/demo/engine";
import { findConversation, setDemo, useDemo } from "@/features/console/demo/store";
import { useLive } from "@/features/console/api/live-store";
import { consoleRoutes, shopHref } from "@/features/console/config";
import type { Reply } from "@/features/console/demo/types";

/** Where a live chip's `open` target goes: a shop, the approvals pile. Null for anything else. */
function openHref(target: string): string | null {
  if (target.startsWith("shop:")) return shopHref(target.slice(5));
  if (target === "approvals" || target.startsWith("order:")) return consoleRoutes.needs;
  return null;
}

/**
 * Reply chips under the newest helper message: the scripted path through every story.
 * Tapping one types it into the composer, sends it and runs the next step. In the live demo the
 * chips are the API's next steps (handoffs contract, safe tier only): an ask for Mimi, or a page.
 */
export function Replies({ slug }: { slug: string }) {
  const router = useRouter();
  const replies = useDemo((s) => findConversation(s, slug)?.replies);
  const busy = useDemo((s) => s.typing?.slug === slug || s.draft?.slug === slug);
  const working = useDemo((s) => !!findConversation(s, slug)?.working);
  const playing = useDemo((s) => s.playing);
  const capped = useLive((s) => !!s.cap);
  const live = isApiThread(slug);
  if (!replies?.length || busy || (live && (capped || working))) return null;
  const tap = (r: Reply) => {
    if (playing) return;
    if (!live) return void tapChip(slug, r);
    if (r.open) {
      const href = openHref(r.open);
      if (href) router.push(href);
      return;
    }
    /* the chips go once tapped; the ask runs like any other message */
    setDemo((s) => ({ ...s, conversations: s.conversations.map((c) => (c.slug === slug ? { ...c, replies: undefined } : c)) }));
    void liveSend(slug, r.text ?? r.label, { assign: r.assign });
  };
  return (
    <div className="mc-rp mc-in" role="group" aria-label="Suggested replies">
      {replies.map((r) => (
        <button
          key={r.label}
          type="button"
          className="mc-rp__c"
          tabIndex={playing ? -1 : undefined}
          aria-disabled={playing || undefined}
          onClick={() => tap(r)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
