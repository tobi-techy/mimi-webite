import { MimiLooking } from "@/components/ui/MimiLooking";

/** "Nothing matches" state (`.x-void`): Mimi looks around for it. */
export function EmptyState({ children }: { children: string }) {
  return (
    <div className="x-void">
      <MimiLooking size="sm" />
      <p>{children}</p>
    </div>
  );
}
