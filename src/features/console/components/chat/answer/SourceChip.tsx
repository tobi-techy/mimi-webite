"use client";

import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { openDoc } from "@/features/console/demo/engine";
import type { Source, SourceKind } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

export const sourceIcon: Record<SourceKind, IconName> = {
  file: "file-code",
  sheet: "sheet",
  doc: "file-text",
  pdf: "file-text",
  tool: "wrench",
  bank: "landmark",
  whatsapp: "whatsapp",
};

/** Where a fact came from: icon + name in a hairline 3px chip, truncated ("WhatsApp · Joy Pro…"). */
export function SourceChip({ source, className }: { source: Source; className?: string }) {
  const body = (
    <>
      <Icon name={sourceIcon[source.kind]} />
      <span className="mc-src__n">{source.name}</span>
    </>
  );
  if (source.docId)
    return (
      <button type="button" className={cx("mc-src", className)} title={source.name} onClick={() => openDoc(source.docId)}>
        {body}
      </button>
    );
  return (
    <span className={cx("mc-src", className)} title={source.name}>
      {body}
    </span>
  );
}
