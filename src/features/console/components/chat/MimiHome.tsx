"use client";

import { ThreadChat } from "@/features/console/components/chat/ThreadChat";
import { helperEntry } from "@/features/console/demo/roster";
import { useDemo } from "@/features/console/demo/store";
import { TOUR_SLUG } from "@/features/console/demo/tour-state";

/**
 * /console: Mimi's one conversation, opened on her newest task (the one waiting on the owner first).
 * While the demo tour plays (or offers "Play it again") it is the open task, so its chips show.
 */
export function MimiHome() {
  const slug = useDemo((s) => {
    const tour = s.conversations.find((c) => c.slug === TOUR_SLUG);
    if (tour && (tour.state !== "done" || tour.replies?.length)) return TOUR_SLUG;
    return helperEntry(s.conversations, "Mimi")?.slug ?? "";
  });
  return <ThreadChat slug={slug} />;
}
