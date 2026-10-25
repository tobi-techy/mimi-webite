"use client";

import { Button } from "@/features/console/components/ui/Button";
import { useToast } from "@/features/console/hooks/use-toast";
import { computersStore } from "@/features/console/lib/computers-store";

export function PauseAllButton({ label }: { label: string }) {
  const say = useToast();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        computersStore.pauseAll();
        say("All computers paused");
      }}
    >
      {label}
    </Button>
  );
}
