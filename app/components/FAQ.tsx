import type { FaqItem } from "@/content/faq-types";

/** Accessible accordion built on native `details`/`summary`; no JavaScript. */
export function FAQ({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq mt-[clamp(26px,3vw,40px)] border-t border-hairline">
      {items.map((item) => (
        <details key={item.question} className="border-b border-hairline">
          <summary className="relative min-h-11 cursor-pointer list-none py-5 pr-11 text-[clamp(18px,1.6vw,22px)] font-medium leading-[1.3] tracking-[-0.02em]">
            {item.question}
          </summary>
          <div className="faq-answer overflow-hidden">
            <p className="max-w-[68ch] pb-[22px] text-muted">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
