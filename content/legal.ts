/**
 * Shared shape for the legal documents. Copy lives in `privacy.ts` and
 * `terms.ts`; inline formatting is a tiny subset of markdown: `**bold**`,
 * `[label](href)` and a literal newline for a line break.
 */
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

export type LegalSection = {
  /** Anchor id, e.g. `p-4` or `t-14`. */
  id: string;
  /** Display number, e.g. `04`. */
  number: string;
  /** Full section heading. */
  title: string;
  /** Shortened label used in the table of contents. */
  toc: string;
  blocks: LegalBlock[];
};

export type LegalDoc = { sections: LegalSection[] };
