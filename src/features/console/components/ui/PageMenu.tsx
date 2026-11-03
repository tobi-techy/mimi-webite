"use client";

import { USES_API } from "@/features/console/api/config";
import { refresh } from "@/features/console/api/sync";
import { Picker } from "@/features/console/components/ui/Picker";
import { useToast } from "@/features/console/hooks/use-toast";

/** Header "more" menu on list screens: Refresh (and Filters). Demo actions only show a toast. */
export function PageMenu({ page, filters }: { page: string; filters?: string }) {
  const say = useToast();
  /* the API build: Refresh really re-reads the API; there is no filter sheet yet, so no Filters item */
  if (USES_API)
    return (
      <Picker
        label="More actions"
        options={[{ value: "Refresh", icon: "refresh-cw" }]}
        onChange={() => void refresh(true).then(() => say(`${page} refreshed`))}
      />
    );
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
