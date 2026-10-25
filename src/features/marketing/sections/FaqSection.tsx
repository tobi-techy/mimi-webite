import type { ReactNode } from "react";
import { W } from "@/components/ui/Words";
import type { FaqItem } from "@/features/marketing/content/faq";
import { cx } from "@/lib/cx";

type FaqSectionProps = {
  items: FaqItem[];
  /** Cream band (distributors) or plain canvas (brands, shops). */
  cream?: boolean;
  /** The two decorative stickers in the section corners. */
  stickers: ReactNode;
  note?: string;
};

/** "Fair questions": the FAQ accordion used on the audience pages. */
export function FaqSection({ items, cream, stickers, note }: FaqSectionProps) {
  return (
    <section className={cx("x-sec", cream && "x-sec--cream")}>
      <div className="x-wrap x-grid">
        {stickers}
        <div className="x-faq__head x-rv">
          <p className="x-label">FAQ</p>
          <h2 className="x-d2 x-hl">
            <W>Fair questions.</W>
          </h2>
          {note && (
            <p className="x-note" style={{ marginTop: "16px" }}>
              {note}
            </p>
          )}
        </div>
        <div className="x-faq x-rv">
          {items.map((it) => (
            <details key={it.q}>
              <summary>{it.q}</summary>
              <p>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
