"use client";

import { useRouter } from "next/navigation";
import { isApiThread, liveSend } from "@/features/console/api/actions";
import { tapChip } from "@/features/console/demo/engine";
import { findConversation, setDemo, useDemo } from "@/features/console/demo/store";
import { useLive } from "@/features/console/api/live-store";
import { consoleRoutes, shopHref } from "@/features/console/config";
import type { Reply, Worker } from "@/features/console/demo/types";
import { assignFor } from "@/features/console/lib/chat-view";

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
/**
 * Live demo: what each chat suggests when the newest answer brought no chips of its own. Each ask
 * goes to that chat's helper (Mimi's are routed by Mimi).
 */
const CHAT_CHIPS: Record<Worker, string[]> = {
  Mimi: ["What needs me today?", "Who owes the most?", "Any new orders?"],
  Collector: ["Who owes the most?", "Who is late this week?", "How much came in today?"],
  Order: ["Any new orders today?", "What's waiting to deliver?", "Draft a restock for Mama Sola"],
  Proof: ["Any payments to check?", "Any fake alerts this week?", "Check today's transfers"],
  Credit: ["Who is close to their limit?", "Who should get more credit?", "Who is over their limit?"],
  Stock: ["Which shops are running low?", "What sells fastest this week?", "Who needs a restock?"],
  Brand: ["Any promos running?", "Draft a price change note", "Which brand sells best?"],
};

export function Replies({ slug, who = "Mimi", fit = true }: { slug: string; who?: Worker; /** The newest chips came from this chat's helper. */ fit?: boolean }) {
  const router = useRouter();
  const replies = useDemo((s) => findConversation(s, slug)?.replies);
  const busy = useDemo((s) => s.typing?.slug === slug || s.draft?.slug === slug);
  const working = useDemo((s) => !!findConversation(s, slug)?.working);
  const playing = useDemo((s) => s.playing);
  const capped = useLive((s) => !!s.cap);
  const live = isApiThread(slug);
  const own = who.toLowerCase();
  /* live: the API's chips when they fit this chat (asks for this helper, or pages), else this chat's own */
  const fitting = live && fit ? (replies ?? []).filter((r) => r.open || !r.assign || r.assign === own || who === "Mimi") : [];
  const shown: Reply[] | undefined = live
    ? fitting.length
      ? fitting
      : CHAT_CHIPS[who].map((label) => ({ label, step: "api", assign: assignFor(who) }))
    : replies;
  if (!shown?.length || busy || (live && (capped || working))) return null;
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
    /* in a helper's chat the ask goes to her; in Mimi's, Mimi routes it (so the handoff shows here) */
    const assign = assignFor(who);
    void liveSend(slug, r.text ?? r.label, { assign, to: who === "Mimi" ? undefined : who });
  };
  return (
    <div className="mc-rp mc-in" role="group" aria-label="Suggested replies">
      {shown.map((r) => (
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
