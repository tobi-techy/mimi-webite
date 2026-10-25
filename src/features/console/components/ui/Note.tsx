import type { ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";

/** Reassurance line at the foot of a screen (`.x-note`). */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="x-note">
      <Icon name="shield-check" />
      {children}
    </p>
  );
}
