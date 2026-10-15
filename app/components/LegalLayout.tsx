import { RichText } from "./RichText";
import { Eyebrow } from "./Section";
import { StickerCluster, type StickerPlacement } from "./StickerCluster";
import type { LegalDoc } from "@/content/legal";

type LegalLayoutProps = {
  doc: LegalDoc;
  title: string;
  tocLabel: string;
  /** Sticker(s) shown beside the legal header. */
  headerStickers: StickerPlacement[];
};

export function LegalLayout({ doc, title, tocLabel, headerStickers }: LegalLayoutProps) {
  return (
    <>
      <header className="grid items-end gap-6 pt-[clamp(40px,6vw,86px)] min-[1000px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Eyebrow>Legal</Eyebrow>
          <h1 className="mt-4 text-[clamp(38px,6.4vw,84px)] font-medium leading-none tracking-[-0.045em]">
            {title}
          </h1>
          <p className="mt-4 text-base text-muted">Last updated: 15 October 2026</p>
          <p className="mt-[22px] max-w-[720px] rounded-2xl bg-tint2 px-[18px] py-3.5 text-[15px] text-soft">
            This document is a draft for the Mimi pilot and is being reviewed by Nigerian legal counsel.
          </p>
        </div>
        <StickerCluster
          items={headerStickers}
          className="relative mx-auto h-[clamp(150px,17vw,210px)] w-[clamp(200px,24vw,300px)] max-[760px]:h-[200px] max-[760px]:w-full"
        />
      </header>

      <div className="mt-[clamp(30px,4vw,56px)] grid grid-cols-1 gap-[clamp(30px,5vw,80px)] min-[1000px]:grid-cols-[220px_minmax(0,720px)]">
        <nav
          aria-label={tocLabel}
          className="rounded-sheet bg-tint2 p-[18px] min-[1000px]:sticky min-[1000px]:top-[104px] min-[1000px]:max-h-[calc(100vh-124px)] min-[1000px]:self-start min-[1000px]:overflow-auto min-[1000px]:bg-transparent min-[1000px]:p-0"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Contents</p>
          <ol className="mt-3 grid list-none p-0">
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex min-h-[34px] items-center gap-2.5 text-sm text-muted hover:text-ink"
                >
                  <span className="w-5 shrink-0 font-mono text-xs">{section.number}</span>
                  {section.toc}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article>
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id} className="pt-[34px] first:pt-0">
              <h2 className="mb-3 flex items-baseline gap-3 text-[clamp(22px,2vw,28px)] font-medium leading-[1.2] tracking-[-0.03em]">
                <span className="shrink-0 font-mono text-[13px] font-normal text-muted">{section.number}</span>
                {section.title}
              </h2>
              {section.blocks.map((block, index) => {
                if (block.type === "h3") {
                  return (
                    <h3
                      key={index}
                      className="mt-[18px] mb-1.5 text-[17px] font-medium leading-[1.3] tracking-[-0.02em]"
                    >
                      {block.text}
                    </h3>
                  );
                }
                if (block.type === "ul") {
                  return (
                    <ul key={index} className="mb-3 list-disc pl-5">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="mb-1.5 text-base leading-[1.65] text-soft">
                          <RichText text={item} />
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={index} className="mb-3 text-base leading-[1.65] text-soft">
                    <RichText text={block.text} />
                  </p>
                );
              })}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
