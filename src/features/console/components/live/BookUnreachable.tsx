"use client";

import { useUnreachable } from "@/features/console/api/hooks";
import { retryLive } from "@/features/console/api/sync";
import { Button } from "@/features/console/components/ui/Button";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Note } from "@/features/console/components/ui/Note";

/**
 * What a book page shows when it has no rows. With the API reachable that is the honest "nothing
 * here yet"; when Mimi could not be reached it says so and offers Retry, because an empty book
 * would read as "you are owed nothing" when the truth is that nothing could be read.
 */
export function BookUnreachable({ empty }: { empty: string }) {
  const unreachable = useUnreachable();
  if (!unreachable) return <EmptyState>{empty}</EmptyState>;
  return (
    <>
      <EmptyState>Mimi can&apos;t be reached right now.</EmptyState>
      <Note>
        <Button size="sm" variant="ghost" onClick={() => void retryLive()}>
          Try again
        </Button>
      </Note>
    </>
  );
}
