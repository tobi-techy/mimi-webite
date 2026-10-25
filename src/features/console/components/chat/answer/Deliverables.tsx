"use client";

import { useState } from "react";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { openDoc } from "@/features/console/demo/engine";
import type { Deliverable, DeliverableType } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

export const deliverableIcon: Record<DeliverableType, IconName> = { Sheet: "sheet", Doc: "file-text", PDF: "file-text" };

/** The skeleton inside a preview card: a grid for sheets, text lines for docs and PDFs. */
function Preview({ type }: { type: DeliverableType }) {
  return (
    <span className={cx("mc-dv__pv", `is-${type.toLowerCase()}`)} aria-hidden="true">
      <span className="mc-dv__paper">
        {type === "Sheet" ? (
          <span className="mc-dv__grid">
            {Array.from({ length: 12 }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        ) : (
          <>
            <i style={{ width: "78%" }} />
            <i style={{ width: "56%" }} />
            <i style={{ width: "34%" }} />
          </>
        )}
      </span>
    </span>
  );
}

function TypeTag({ type }: { type: DeliverableType }) {
  return (
    <span className="mc-dv__type">
      <Icon name={deliverableIcon[type]} />
      {type}
    </span>
  );
}

/** "Deliverables": preview cards (skeleton + title + type) and a compact row list with Show all. */
export function Deliverables({
  title = "Deliverables",
  cards,
  rows,
  visible = 3,
}: {
  title?: string;
  cards?: Deliverable[];
  rows?: Deliverable[];
  visible?: number;
}) {
  const [all, setAll] = useState(false);
  const list = rows ?? [];
  const shown = all ? list : list.slice(0, visible);
  const hidden = list.length - shown.length;
  return (
    <section className="mc-dv">
      <h3 className="mc-ans__h">{title}</h3>
      {cards?.length ? (
        <div className="mc-dv__cards">
          {cards.map((d) => (
            <button key={d.title} type="button" className="mc-dv__card" onClick={() => openDoc(d.docId)} disabled={!d.docId}>
              <Preview type={d.type} />
              <span className="mc-dv__ft">
                <span className="mc-dv__t">{d.title}</span>
                <TypeTag type={d.type} />
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {list.length ? (
        <ul className="mc-dv__rows">
          {shown.map((d) => (
            <li key={d.title}>
              <button type="button" className="mc-dv__row" onClick={() => openDoc(d.docId)} disabled={!d.docId}>
                <Icon name={deliverableIcon[d.type]} />
                <span className="mc-dv__t">{d.title}</span>
                <span className="mc-dv__k">{d.type}</span>
              </button>
            </li>
          ))}
          {list.length > visible && (
            <li>
              <button type="button" className="mc-dv__row mc-dv__more" aria-expanded={all} onClick={() => setAll(!all)}>
                <Icon name="chevrons-down" />
                <span className="mc-dv__t">{all ? "Show less" : `Show all ${list.length}`}</span>
                {!all && <span className="mc-dv__k">+{hidden}</span>}
              </button>
            </li>
          )}
        </ul>
      ) : null}
    </section>
  );
}
