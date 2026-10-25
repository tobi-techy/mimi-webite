import type { ReactNode } from "react";
import { CitationBadge } from "@/features/console/components/chat/answer/CitationBadge";
import { EntityChip } from "@/features/console/components/chat/answer/EntityChip";
import { shopHref } from "@/features/console/config";
import { shops } from "@/features/console/content/shops";
import type { Entity, EntityKind, Source } from "@/features/console/demo/types";

const KINDS: readonly EntityKind[] = ["shop", "route", "helper", "brand", "bank", "file"];

/** Where an entity chip links: a shop with a page in the book goes to it. */
export function entityHref(e: Entity): string | undefined {
  if (e.kind !== "shop") return undefined;
  const s = shops.find((x) => x.name.toLowerCase() === e.label.toLowerCase());
  return s ? shopHref(s.id) : undefined;
}

/** `[[kind:Label]]` → an entity, or null when the kind is unknown. */
function parseEntity(raw: string): Entity | null {
  const at = raw.indexOf(":");
  if (at < 0) return null;
  const kind = raw.slice(0, at).trim() as EntityKind;
  const label = raw.slice(at + 1).trim();
  return KINDS.includes(kind) && label ? { kind, label } : null;
}

/** Copy with the token syntax removed (for Copy, screen-reader labels and previews). */
export function plainInline(text: string): string {
  return text
    .replace(/\[\[(\w+):([^\]]+)\]\]/g, "$2")
    .replace(/\[\^\d+\]/g, "")
    .replace(/\*\*|==/g, "")
    .replace(/\s+([.,?!])/g, "$1");
}

/**
 * Inline copy for prompts and answers: `**bold**`, `==orange==`, entity chips (`[[shop:Joy
 * Provisions]]`) and numbered citations (`[^2]`). Unclosed markers are dropped.
 */
export function Inline({ text, cites, links = true }: { text: string; cites?: Record<number, Source>; links?: boolean }) {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|==(.+?)==|\[\[([^\]]+)\]\]|\[\^(\d+)\]/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  const plain = (t: string) => t.replace(/\*\*|==/g, "");
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(plain(text.slice(last, m.index)));
    if (m[1]) out.push(<b key={k++}>{m[1]}</b>);
    else if (m[2]) out.push(<span key={k++} className="mc-or">{m[2]}</span>);
    else if (m[3]) {
      const e = parseEntity(m[3]);
      out.push(e ? <EntityChip key={k++} entity={e} href={links ? entityHref(e) : undefined} /> : m[0]);
    } else if (m[4]) {
      const n = Number(m[4]);
      out.push(<CitationBadge key={k++} n={n} source={cites?.[n]} />);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(plain(text.slice(last)));
  return <>{out}</>;
}
