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
  return <ThreadChat slug={id} focus={focus} />;
}
