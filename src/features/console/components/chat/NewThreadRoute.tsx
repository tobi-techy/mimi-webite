"use client";

import { useSearchParams } from "next/navigation";
import { ThreadChat } from "@/features/console/components/chat/ThreadChat";

/** Threads started in this demo session live at /console/threads/new?id=… (static-export safe). */
export function NewThreadRoute() {
  const id = useSearchParams().get("id") ?? "";
  return <ThreadChat slug={id} />;
}
