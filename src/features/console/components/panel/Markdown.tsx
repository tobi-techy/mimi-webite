import type { ReactNode } from "react";
import { safeHref } from "@/features/console/lib/safe-href";

/**
 * A small GitHub-flavoured Markdown renderer for the Docs viewer (no dependency): headings,
 * paragraphs, bullet and numbered lists, tables, fenced code, quotes, rules, and inline
 * **bold**, *italic*, ~~struck~~, `code`, [links](url) and ==your edits== (orange highlight).
 */
function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|==(.+?)==|`([^`]+)`|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)|~~(.+?)~~/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = key;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{inline(m[1], k * 10)}</strong>);
    else if (m[2]) out.push(<span key={k++} className="mc-edit">{m[2]}</span>);
    else if (m[3]) out.push(<code key={k++}>{m[3]}</code>);
    else if (m[4]) out.push(<em key={k++}>{m[4]}</em>);
    else if (m[5])
      out.push(
        safeHref(m[6]) ? (
          <a key={k++} href={safeHref(m[6])} target="_blank" rel="noopener noreferrer">
            {m[5]}
          </a>
        ) : (
          m[5]
        ),
      );
    else if (m[7]) out.push(<s key={k++}>{m[7]}</s>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i] ?? "")) code.push(lines[i++] ?? "");
      i++;
      blocks.push(
        <pre key={k++} data-lang={fence[1] || undefined}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1]!.length;
      const body = inline(h[2]!);
      blocks.push(level === 1 ? <h1 key={k++}>{body}</h1> : level === 2 ? <h2 key={k++}>{body}</h2> : <h3 key={k++}>{body}</h3>);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={k++} />);
      i++;
      continue;
    }
    if (/^\s*\|/.test(line) && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1] ?? "")) {
      const head = cells(line);
      const align = cells(lines[i + 1] ?? "").map((c) => (c.endsWith(":") ? "right" : undefined));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i] ?? "")) rows.push(cells(lines[i++] ?? ""));
      blocks.push(
        <div key={k++} className="mc-md__tw">
          <table>
            <thead>
              <tr>
                {head.map((c, j) => (
                  <th key={j} style={{ textAlign: align[j] }}>
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, j) => (
                    <td key={j} style={{ textAlign: align[j] }}>
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i] ?? "")) q.push((lines[i++] ?? "").replace(/^>\s?/, ""));
      blocks.push(<blockquote key={k++}>{inline(q.join(" "))}</blockquote>);
      continue;
    }
    const ordered = /^\s*\d+\.\s+/.test(line);
    if (ordered || /^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      const re = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      while (i < lines.length && re.test(lines[i] ?? "")) items.push((lines[i++] ?? "").replace(re, ""));
      const lis = items.map((it, j) => {
        const task = /^\[( |x)\]\s+/.exec(it);
        return (
          <li key={j} className={task ? "is-task" : undefined}>
            {task && <input type="checkbox" checked={task[1] === "x"} readOnly aria-label={task[1] === "x" ? "Done" : "Not done"} />}
            {inline(task ? it.slice(task[0].length) : it)}
          </li>
        );
      });
      blocks.push(ordered ? <ol key={k++}>{lis}</ol> : <ul key={k++}>{lis}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() && !/^(#{1,4}\s|```|>|\s*[-*]\s|\s*\d+\.\s|\s*\|)/.test(lines[i] ?? "")) para.push(lines[i++] ?? "");
    if (!para.length) para.push(lines[i++] ?? "");
    blocks.push(<p key={k++}>{inline(para.join(" "))}</p>);
  }
  return <div className={className ? `mc-md ${className}` : "mc-md"}>{blocks}</div>;
}
