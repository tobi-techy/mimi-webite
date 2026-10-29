/**
 * Helper replies read like a WhatsApp message (Tobi, 29 Oct 2026: "let switch out of the markdown
 * format"): plain text, line breaks kept, markdown syntax taken out so stray `**`, `#`, backticks,
 * list dashes and `[text](url)` never show raw. Works on demo copy and live API replies alike.
 */
export function toPlainText(md: string): string {
  const out: string[] = [];
  let fenced = false;
  for (const raw of md.replace(/\r\n?/g, "\n").split("\n")) {
    let line = raw;
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) {
      out.push(line);
      continue;
    }
    /* table separator rows go; table rows read as "a · b · c" */
    if (/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line) && line.includes("-") && line.includes("|")) continue;
    if (/^\s*\|.*\|\s*$/.test(line))
      line = line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean)
        .join(" · ");
    /* horizontal rules */
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) continue;
    line = line
      .replace(/^(\s*)#{1,6}\s+/, "$1") // headings
      .replace(/^(\s*)>\s?/, "$1") // quotes
      .replace(/^(\s*)[-*+]\s+\[[ xX]\]\s+/, "$1• ") // task items
      .replace(/^(\s*)[-*+]\s+/, "$1• "); // bullets
    out.push(inlinePlain(line));
  }
  return out
    .join("\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Inline markdown and console tokens to plain words. */
export function inlinePlain(text: string): string {
  return (
    text
      /* images: their alt text; links: their words (the bare URL when the words are the URL) */
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, "$1")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, words: string, url: string) => (words.trim() === url ? url : words))
      /* console tokens: entity chips → their label, citations dropped */
      .replace(/\[\[(\w+):([^\]]+)\]\]/g, "$2")
      .replace(/\s*\[\^\d+\]/g, "")
      /* emphasis, highlight, strike, code */
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/__(.+?)__/g, "$1")
      .replace(/==(.+?)==/g, "$1")
      .replace(/~~(.+?)~~/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])/g, "$1$2")
      .replace(/(^|[^\w])_(?!\s)([^_\n]+?)_(?!\w)/g, "$1$2")
      /* anything left open (mid-stream, or a typo) */
      .replace(/\*\*|==|~~|`/g, "")
  );
}

/** Splits plain text into words and http(s) URLs so URLs can be auto-linked. */
export function splitUrls(text: string): { text: string; url?: string }[] {
  const parts: { text: string; url?: string }[] = [];
  const re = /https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[0], url: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
