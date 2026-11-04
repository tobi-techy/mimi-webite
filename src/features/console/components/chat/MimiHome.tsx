"use client";

import { ThreadChat } from "@/features/console/components/chat/ThreadChat";
import { helperEntry } from "@/features/console/demo/roster";
import { useDemo } from "@/features/console/demo/store";

/** /console: Mimi's one conversation, opened on her newest task (the one waiting on the owner first). */
export function MimiHome() {
  const slug = useDemo((s) => helperEntry(s.conversations, "Mimi")?.slug ?? "");
  return <ThreadChat slug={slug} />;
}
