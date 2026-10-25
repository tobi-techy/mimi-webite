import type { ReactNode } from "react";
import { Identity } from "@/features/console/components/ui/Avatar";

type RowProps = {
  title: string;
  description?: string;
  /** Initials: shows the title as an identity (avatar + two lines). */
  avatar?: string;
  /** The control on the right. */
  children?: ReactNode;
};

/** A settings row (`.c-row`): label and optional description left, control right, 56px min height. */
export function Row({ title, description, avatar, children }: RowProps) {
  return (
    <div className="c-row">
      <div className="c-row__main">
        {avatar ? (
          <Identity name={title} sub={description} initials={avatar} size="md" neutral />
        ) : (
          <>
            <span className="c-row__title">{title}</span>
            {description && <span className="c-row__desc">{description}</span>}
          </>
        )}
      </div>
      {children && <div className="c-row__control">{children}</div>}
    </div>
  );
}
