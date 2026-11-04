"use client";

import { useSearchParams } from "next/navigation";
import { ThreadChat } from "@/features/console/components/chat/ThreadChat";
import { rosterNames } from "@/features/console/demo/roster";

/** Threads started in this demo session live at /console/threads/new?id=… (static-export safe); `&with=Stock` shows one helper's side. */
export function NewThreadRoute() {
  const q = useSearchParams();
  const id = q.get("id") ?? "";
  /* live demo: `with=` opens one helper's side of the owner's shared thread with Mimi */
  const focus = rosterNames.find((n) => n !== "Mimi" && n === q.get("with"));
  /* an empty id is this route saying it was opened with no thread chosen, not the home page's
     "Mimi could not be reached": the screen has to word those two differently (Tobi, 4 Nov 2026) */
  return <ThreadChat slug={id} focus={focus} openedWithoutId={!id} />;
}
