"use client";

import { Picker } from "@/features/console/components/ui/Picker";
import { useToast } from "@/features/console/hooks/use-toast";

/** Header "more" menu on list screens: Refresh (and Filters). Demo actions only show a toast. */
export function PageMenu({ page, filters }: { page: string; filters?: string }) {
  const say = useToast();
  return (
    <Picker
      label="More actions"
      options={[
        { value: "Refresh", icon: "refresh-cw" },
        ...(filters ? [{ value: "Filters", icon: "filter" as const }] : []),
      ]}
      onChange={(v) => say(v === "Refresh" ? `${page} up to date` : `Filters: ${filters}`)}
    />
  );
}
