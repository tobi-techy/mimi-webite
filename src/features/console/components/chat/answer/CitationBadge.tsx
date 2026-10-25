"use client";

import { openDoc } from "@/features/console/demo/engine";
import type { Source } from "@/features/console/demo/types";

/** A small numbered citation after a claim ("1"). Opens the source in Docs when it has one. */
export function CitationBadge({ n, source }: { n: number; source?: Source }) {
  const label = source ? `Source ${n}: ${source.name}` : `Source ${n}`;
  if (source?.docId)
    return (
      <button type="button" className="mc-cite" title={source.name} aria-label={label} onClick={() => openDoc(source.docId)}>
        {n}
      </button>
    );
  return (
    <span className="mc-cite" title={source?.name} aria-label={label} role="note">
      {n}
    </span>
  );
}
