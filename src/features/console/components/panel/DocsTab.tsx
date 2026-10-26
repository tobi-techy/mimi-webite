"use client";

import { useState } from "react";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { VerdictTag } from "@/features/console/components/chat/Messages";
import { Markdown } from "@/features/console/components/panel/Markdown";
import { Icon } from "@/features/console/components/ui/Icon";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { closeDocument, editDocNote, openDoc, restoreVersion } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import type { Doc, DocFilter, DocKind } from "@/features/console/demo/types";
import { useToast } from "@/features/console/hooks/use-toast";
import { cx } from "@/lib/cx";

export type { DocFilter };
const FILTERS: DocFilter[] = ["All", "By helpers", "By you", "This thread"];
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-US")}`;

export const kindIcon: Record<DocKind, IconName> = {
  PDF: "file-text",
  MD: "book-open",
  IMG: "image",
  CSV: "list",
  TXT: "message-square",
  DOCX: "paperclip",
};

function By({ by }: { by: Doc["by"] }) {
  return by === "you" ? (
    <span className="mc-by is-you">
      <Icon name="users" />
      By you
    </span>
  ) : (
    <span className="mc-by">
      <HelperFace name={by} size={11} ring={16} />
      By {by}
    </span>
  );
}

/**
 * Docs: a filterable list, or one document full width (separate states, never side by side).
 * The viewer reads Markdown, PDF, images, CSV, plain text, and shows a Download state for the rest.
 */
export function DocsTab({ slug, filter, setFilter }: { slug: string; filter: DocFilter; setFilter: (f: DocFilter) => void }) {
  const docs = useDemo((s) => s.docs);
  const docId = useDemo((s) => s.panel.docId);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState(false);
  const doc = docs.find((d) => d.id === docId);
  if (doc) return <DocView doc={doc} />;
  const shown = docs.filter(
    (d) =>
      (filter === "All" ||
        (filter === "By you" && d.by === "you") ||
        (filter === "By helpers" && d.by !== "you") ||
        (filter === "This thread" && d.thread === slug)) &&
      (!q || `${d.title} ${d.kind}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="mc-docs">
      <div className="mc-dfl" role="toolbar" aria-label="Filter docs">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={cx("mc-chip", filter === f && "is-on")} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
        <span className="mc-grow" />
        {search ? (
          <input className="mc-dfl__q" autoFocus aria-label="Search docs" placeholder="Search docs" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => !q && setSearch(false)} />
        ) : (
          <button type="button" className="mc-ib" aria-label="Search docs" onClick={() => setSearch(true)}>
            <Icon name="search" />
          </button>
        )}
      </div>
      <ul className="mc-dl" aria-label="Docs">
        {shown.length === 0 && <li className="mc-empty mc-mono">No docs here yet</li>}
        {shown.map((d) => (
          <li key={d.id}>
            <button type="button" className="mc-di" onClick={() => openDoc(d.id)}>
              <span className="mc-di__k" aria-hidden="true">
                <Icon name={kindIcon[d.kind]} />
                <span>{d.kind}</span>
              </span>
              <span className="mc-di__tx">
                <b>{d.title}</b>
                <small>
                  <By by={d.by} />
                  <span>· {d.at}</span>
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- markdown made from live rows (plans and reports stay in sync with their cards) ---------- */

function planMarkdown(doc: Doc): string | null {
  const b = doc.body;
  if (b.type === "plan") {
    const rows = b.rows
      .map((r) => {
        const shop = r.tone === "Skip" ? `~~${r.label}~~` : r.label;
        const tone = r.edited ? `==${r.tone ?? ""}==` : (r.tone ?? r.note ?? "");
        return `| ${shop}${r.flag ? ` · ${r.flag}` : ""} | ${r.amount ? r.amount.toLocaleString("en-US") : ""} | ${r.days ?? ""} | ${tone} |`;
      })
      .join("\n");
    return `# Reminder plan\n\nCoral Lane Trading · ${doc.at} · nothing sends until you approve.\n\n## Shops\n\n| Shop | Owes ₦ | Days late | Tone |\n| --- | ---: | ---: | --- |\n${rows}\n\n**Total: ${naira(b.total)}**\n\n## Rules\n\n- Check GTB before every reminder, so nobody who paid gets chased.\n- Polite, but firm past a week.\n- Fake alerts stay on Firm and their next order is held.\n`;
  }
  if (b.type === "report") {
    const total = b.rows.reduce((s, r) => s + r.cartons, 0);
    return `# ${doc.title}\n\n214 shops · week to 23 Oct 2026\n\n| Area | Cartons sold | vs last week |\n| --- | ---: | ---: |\n${b.rows.map((r) => `| ${r.area} | ${r.cartons} | ${r.change} |`).join("\n")}\n\n**${total.toLocaleString("en-US")} cartons** in all.\n\n## Notes\n\n1. Idumota grew the most after the new van route.\n2. Ojota dipped slightly, two shops were closed for repairs.\n\n> Draft. Nothing goes to the brand until you send it.\n`;
  }
  if (b.type === "markdown") return b.text;
  return null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const isNum = (v: string) => /^-?[\d,.]+$/.test(v.trim());

function CsvTable({ text }: { text: string }) {
  const [head = [], ...rows] = parseCsv(text);
  return (
    <div className="mc-csv">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={cx(isNum(c) && "mc-n")}>
                  {isNum(c) && c.length > 3 ? Number(c.replace(/,/g, "")).toLocaleString("en-US") : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mc-mono mc-csv__k">
        {rows.length} rows · {head.length} columns
      </p>
    </div>
  );
}

/** A local file URL for text-based docs (so Download works for them too). */
function textHref(doc: Doc): { href: string; name: string } | null {
  const b = doc.body;
  const base = doc.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (b.type === "pdf" || b.type === "image") return { href: b.src, name: b.src.split("/").pop() ?? base };
  if (b.type === "file") return { href: b.src, name: b.name };
  const md = planMarkdown(doc);
  const text = md ?? (b.type === "csv" || b.type === "text" ? b.text : null);
  if (text === null) return null;
  const ext = md !== null ? "md" : b.type === "csv" ? "csv" : "txt";
  return { href: `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`, name: `${base}.${ext}` };
}

function Viewer({ doc }: { doc: Doc }) {
  const b = doc.body;
  const file = textHref(doc);
  const md = planMarkdown(doc);
  if (md !== null)
    return (
      <div className="mc-sheetpg">
        <Markdown text={md} />
      </div>
    );
  if (b.type === "pdf")
    return (
      <div className="mc-pdf">
        <object data={`${b.src}#view=FitH`} type="application/pdf" aria-label={doc.title}>
          <iframe src={b.src} title={doc.title} />
          <Fallback doc={doc} file={file} why="This browser can't show PDFs inline." />
        </object>
      </div>
    );
  if (b.type === "image")
    return (
      <figure className="mc-img">
        <img src={b.src} alt={doc.title} />
        <figcaption className="mc-mono">{doc.note}</figcaption>
      </figure>
    );
  if (b.type === "csv")
    return (
      <div className="mc-sheetpg mc-sheetpg--wide">
        <CsvTable text={b.text} />
      </div>
    );
  if (b.type === "text")
    return (
      <div className="mc-sheetpg">
        <pre className="mc-txt">{b.text}</pre>
      </div>
    );
  if (b.type === "invoice")
    return (
      <div className="mc-paper">
        <Invoice doc={doc} />
      </div>
    );
  return <Fallback doc={doc} file={file} why={`${doc.kind} files can't be previewed here.`} />;
}

function Fallback({ doc, file, why }: { doc: Doc; file: { href: string; name: string } | null; why: string }) {
  return (
    <div className="mc-nopv">
      <span className="mc-nopv__k">
        <Icon name={kindIcon[doc.kind]} />
        <span className="mc-mono">{doc.kind}</span>
      </span>
      <b>{doc.title}</b>
      <p>{why} Download it to open it on your device.</p>
      {file && (
        <a className="mc-btn mc-btn--pri" href={file.href} download={file.name}>
          <Icon name="download" />
          Download {file.name}
        </a>
      )}
    </div>
  );
}

function DocView({ doc }: { doc: Doc }) {
  const say = useToast();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(doc.note);
  const [lastId, setLastId] = useState(doc.id);
  if (lastId !== doc.id) {
    setLastId(doc.id);
    setNote(doc.note);
    setEditing(false);
  }
  const youEdit = doc.versions.find((v) => v.by === "you");
  const file = textHref(doc);

  return (
    <div className="mc-dv">
      <div className="mc-dvh">
        <button type="button" className="mc-ib mc-dvh__back" aria-label="Back to docs" onClick={closeDocument}>
          <Icon name="chevron-left" />
        </button>
        <div className="mc-dvh__t">
          <b>{doc.title}</b>
          <small>
            <span className="mc-dvh__kind">{doc.kind}</span>
            <By by={doc.by} />
            <span>{youEdit ? `· ${youEdit.note.toLowerCase()} by you ${youEdit.at}` : `· ${doc.at}`}</span>
          </small>
        </div>
        <button type="button" className={cx("mc-ib mc-ib--b", editing && "is-on")} aria-pressed={editing} aria-label="Edit the note" onClick={() => setEditing(!editing)}>
          <Icon name="pen" />
        </button>
        {file ? (
          <a className="mc-ib mc-ib--b" href={file.href} download={file.name} aria-label={`Download ${file.name}`}>
            <Icon name="download" />
          </a>
        ) : (
          <button type="button" className="mc-ib mc-ib--b" aria-label="Download" onClick={() => say(`${doc.title} downloaded`)}>
            <Icon name="download" />
          </button>
        )}
        <button type="button" className="mc-btn mc-btn--sm mc-btn--pri" onClick={() => say(`${doc.title} sent on WhatsApp`)}>
          <Icon name="share" />
          <span className="mc-hide-tight">Send</span>
        </button>
      </div>
      <div className={cx("mc-dv__scroll", doc.body.type === "pdf" && "is-pdf")}>
        <Viewer doc={doc} />
        <div className="mc-dnote">
          <span className="mc-mono">Note</span>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editDocNote(doc.id, note);
                setEditing(false);
              }}
            >
              <input aria-label="Note on this doc" value={note} autoFocus onChange={(e) => setNote(e.target.value)} />
              <button type="submit" className="mc-btn mc-btn--sm mc-btn--pri">
                Save
              </button>
            </form>
          ) : (
            <p>
              <span className={cx(doc.noteEdited && "mc-edit")}>{doc.note}</span>
            </p>
          )}
        </div>
      </div>
      <div className="mc-hist">
        <span className="mc-mono">Versions</span>
        <span className="mc-hist__list">
          {doc.versions.slice(0, 3).map((v, i) => (
            <button
              key={v.v}
              type="button"
              className={cx("mc-chip", i === 0 && "is-on")}
              title={v.note}
              aria-label={`Version ${v.v} by ${v.by}, ${v.note}${i ? ". Restore" : ""}`}
              onClick={() => i && restoreVersion(doc.id, v.v)}
            >
              v{v.v} · {v.by}
            </button>
          ))}
        </span>
        <span className="mc-mono mc-hist__k">Your edits in orange</span>
      </div>
    </div>
  );
}

function Invoice({ doc }: { doc: Doc }) {
  return (
      <>
        <div className="mc-paper__hd">
          <div>
            <h4>Invoice</h4>
            <span className="mc-paper__m">{doc.title.split("·")[0]?.replace("Invoice", "").trim()} · 14 Oct 2026</span>
          </div>
          <div className="mc-paper__r">
            <b>Coral Lane Trading Ltd</b>
            <span className="mc-paper__m">Lagos mainland</span>
          </div>
        </div>
        <div className="mc-paper__sec">
          <span className="mc-paper__m">Bill to</span>
          {doc.title.split("·")[1]?.trim() ?? "Chuks & Sons"} Provisions, Ojota
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="mc-n">Qty</th>
              <th className="mc-n">Amount ₦</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Indomie Chicken 70g (40)</td><td className="mc-n">12</td><td className="mc-n">38,400</td></tr>
            <tr><td>Hypo Bleach 1L (12)</td><td className="mc-n">4</td><td className="mc-n">16,000</td></tr>
            <tr><td>Peak Milk 400g (24)</td><td className="mc-n">1</td><td className="mc-n">16,000</td></tr>
            <tr><td>Part payment 20 Oct</td><td className="mc-n"></td><td className="mc-n">−8,000</td></tr>
          </tbody>
        </table>
        <div className="mc-paper__tot">
          <span>Balance due</span>
          <span>₦62,400</span>
        </div>
        <div className="mc-paper__sig">
          <div>
            <span className="mc-paper__m">Received by</span>
            <i>C. Okeke</i>
          </div>
          <VerdictTag v="verified">Signed on delivery</VerdictTag>
        </div>
      </>
    );
}
