"use client";

import { useSearchParams } from "next/navigation";
import { TaskDetail } from "@/features/console/components/computers/TaskDetail";

/** Reads ?id= so the static export has one page to serve (like /console/shops/live?id=…). */
export function TaskDetailRoute() {
  const params = useSearchParams();
  return <TaskDetail id={params.get("id") ?? ""} />;
}
