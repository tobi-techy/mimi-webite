import { CitationBadge } from "@/features/console/components/chat/answer/CitationBadge";
import { Inline } from "@/features/console/components/chat/answer/Inline";
import { SourceChip } from "@/features/console/components/chat/answer/SourceChip";
import type { HighlightItem, Source } from "@/features/console/demo/types";

/** "Highlights": bullets with entity chips, bold numbers, numbered citations and source chips. */
export function Highlights({ title = "Highlights", items, cites }: { title?: string; items: HighlightItem[]; cites?: Record<number, Source> }) {
  return (
    <section className="mc-hl">
      <h3 className="mc-ans__h">{title}</h3>
      <ul className="mc-hl__l">
        {items.map((it, i) => (
          <li key={i}>
            <Inline text={it.text} cites={cites} />
            {it.cite?.map((n) => <CitationBadge key={`c${n}`} n={n} source={cites?.[n]} />)}
            {it.sources?.map((s) => <SourceChip key={s.name} source={s} className="mc-src--inline" />)}
          </li>
        ))}
      </ul>
    </section>
  );
}
