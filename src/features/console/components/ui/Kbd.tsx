import type { ReactNode } from "react";

/** One keyboard key (`.c-kbd`). */
export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="c-kbd">{children}</kbd>;
}

/** A key combination, e.g. ⌘ K. */
export function Kbds({ keys }: { keys: readonly string[] }) {
  return (
    <span className="c-kbds">
      {keys.map((k) => (
        <Kbd key={k}>{k}</Kbd>
      ))}
    </span>
  );
}
