import type { ReactNode } from "react";
import { Sticker, Stickers, type StickerSpec } from "@/components/ui/Sticker";
import { Heading, Label } from "@/components/ui/Text";

/** `toc` overrides the title in the contents list when it is shorter there. */
export type LegalClause = { id: string; title: string; toc?: string; body: ReactNode };
export type LegalDoc = {
  title: string;
  tocLabel: string;
  updated: string;
  status: string;
  clauses: LegalClause[];
};

/** A legal document: title block, numbered contents and numbered clauses. */
export function LegalPage({ doc, asideSticker }: { doc: LegalDoc; asideSticker: StickerSpec }) {
  const num = (i: number) => String(i + 1).padStart(2, "0");
  return (
    <>
      <header className="x-legal__head">
        <div className="x-wrap">
          <Label>Legal</Label>
          <div className="x-legal__title">
            <Heading as="h1" size="d1" reveal>
              {doc.title}
            </Heading>{" "}
            <Sticker src="sticker-notebook" pos="flow" w={90} r="9deg" />
          </div>
          <p className="x-legal__meta x-mono">
            <span>{doc.updated}</span>
            <span>{doc.status}</span>
          </p>{" "}
          <Sticker src="sticker-stamp" pos="br" w={130} r="-9deg" ox="12%" />
        </div>
      </header>
      <div className="x-wrap x-grid x-legal">
        <Stickers items={[asideSticker]} />
        <nav className="x-toc" aria-label={doc.tocLabel}>
          <Label>Contents</Label>
          <ol>
            {doc.clauses.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  <span>{num(i)}</span>
                  {c.toc ?? c.title}
                </a>
              </li>
            ))}
          </ol>{" "}
          <Sticker src="sticker-pin" pos="flow" w={110} r="-8deg" lazy style={{ marginTop: "36px" }} />
        </nav>
        <article className="x-doc">
          {doc.clauses.map((c, i) => (
            <section key={c.id} className="x-clause" id={c.id}>
              <span>{num(i)}</span>
              <div>
                <h2>{c.title}</h2>
                {c.body}
              </div>
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
