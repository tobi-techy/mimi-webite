"use client";

import { useSearchParams } from "next/navigation";
import { AutoDetail } from "@/features/console/components/automations/AutoDetail";

/** Reads ?id= for automations made in this session. */
export function AutoDetailRoute() {
  return <AutoDetail id={useSearchParams().get("id") ?? ""} />;
}
