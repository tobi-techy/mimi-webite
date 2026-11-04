import type { ReactNode } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import { Pill } from "@/features/console/components/ui/Pill";

/** The honest panel for anything the service does not answer for yet. Never dressed up as working. */
export function NotAvailable({ children }: { children: ReactNode }) {
  return (
    <section className="x-ctna" role="status">
      <Icon name="monitor" className="x-ctna__i" />
      <div className="x-ctna__tx">
        <h2>Not available yet</h2>
        {children}
      </div>
    </section>
  );
}

const LATER = ["Desktop control", "Shell access"] as const;

/** The things the prototype does not do, said plainly so none of them reads as working. */
export function NotYet() {
  return (
    <section className="x-ctny">
      <h2>Not in this prototype</h2>
      <ul>
        {LATER.map((label) => (
          <li key={label}>
            <span>{label}</span>
            <Pill tone="muted">Not available yet</Pill>
          </li>
        ))}
      </ul>
      <p>
        A task runs on its own hosted browser. Mimi does not take over a desktop here and there is no command line to
        type into. You read the step log and the screenshot each step took, and while a task is running you can watch
        it live from the task.
      </p>
    </section>
  );
}
