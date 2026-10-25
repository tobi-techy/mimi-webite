import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { CtaBand } from "@/components/ui/CtaBand";
import { Sticker } from "@/components/ui/Sticker";
import {
  COMPARE_CHECKED,
  alongside,
  alongsideNote,
  compareCta,
  compareFaq,
  compareHub,
  comparisons,
  costNote,
  costRows,
  featureColumns,
  featureNotes,
  featureRows,
  tableNote,
} from "@/features/marketing/content/compare";
import { CellValue, CheckedLine, CompareCard, MimiMark, Monogram } from "./CompareParts";
import { CompareRail, type RailItem } from "./CompareRail";

const rail: RailItem[] = [
  { id: "intro", label: "Intro" },
  { id: "overview", label: "Overview" },
  { id: "matrix", label: "The matrix" },
  { id: "all", label: "All comparisons" },
];

/** /compare: the honest hub. Rail on the left, every section in the content column. */
export function CompareHub() {
  return (
    <>
      <div className="x-wrap x-cmp">
        <CompareRail items={rail} />
        <div className="x-cmp__body">
          <header className="x-cmp__hero" id="intro">
            <p className="x-cmp__date x-mono">Updated {COMPARE_CHECKED}</p>
            <p className="x-label">{compareHub.eyebrow}</p>
            <div className="x-cmp__title">
              <h1 className="x-cmp__h1">{compareHub.title}</h1>
              <Sticker src="sticker-notebook" pos="flow" w={96} r="8deg" />
            </div>
            <p className="x-lead">{compareHub.sub}</p>
            <div className="x-cmp__intro">
              {compareHub.intro.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <div className="x-btns">
              <ButtonLink href={compareCta.href} arrow>
                {compareCta.button}
              </ButtonLink>
              <ButtonLink href="#matrix" variant="ghost">
                See the matrix
              </ButtonLink>
            </div>
          </header>

          <section className="x-cmp__sec" id="overview" aria-labelledby="overview-h">
            <p className="x-label">Overview</p>
            <h2 className="x-cmp__h2" id="overview-h">
              The short version
            </h2>
            <p className="x-cmp__p">
              Most tools help you take orders and send invoices. Mimi does that too. Where Mimi is different:
            </p>
            <ul className="x-cmp__points">
              {compareHub.shortVersion.map((s) => (
                <li key={s.title}>
                  <b>{s.title}</b> {s.body}
                </li>
              ))}
            </ul>

            <h3 className="x-cmp__h3">Feature by feature</h3>
            <div className="x-cmp__tablewrap">
              <table className="x-cmp__table x-cmp__table--features">
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="x-sr">Feature</span>
                    </th>
                    {featureColumns.map((c, i) => (
                      <th key={c} scope="col" className={i === 0 ? "is-mimi" : undefined}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((r) => (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      {r.cells.map((v, i) => (
                        <td key={featureColumns[i]} className={i === 0 ? "is-mimi" : undefined}>
                          <CellValue value={v} mark={r.marks?.[i]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="x-cmp__notes">
              {featureNotes.map((n) => (
                <p key={n.slice(0, 12)}>{n}</p>
              ))}
            </div>
            <CheckedLine>{tableNote}</CheckedLine>

            <h3 className="x-cmp__h3">What it costs: a 100-shop example</h3>
            <div className="x-cmp__tablewrap">
              <table className="x-cmp__table x-cmp__table--stack">
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">100 shops a month</th>
                    <th scope="col">Included at that price</th>
                    <th scope="col">WhatsApp fees</th>
                  </tr>
                </thead>
                <tbody>
                  {costRows.map((r) => (
                    <tr key={r.plan} className={r.mimi ? "is-mimi-row" : undefined}>
                      <th scope="row">{r.plan}</th>
                      <td className="x-cmp__num" data-label="100 shops a month">
                        {r.price}
                      </td>
                      <td data-label="Included">{r.included}</td>
                      <td data-label="WhatsApp fees">{r.fees}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CheckedLine>{costNote}</CheckedLine>
          </section>

          <section className="x-cmp__sec" id="matrix" aria-labelledby="matrix-h">
            <p className="x-label">The matrix</p>
            <h2 className="x-cmp__h2" id="matrix-h">
              Every tool, one line each
            </h2>
            <div className="x-cmp__tablewrap">
              <table className="x-cmp__table x-cmp__table--matrix x-cmp__table--stack">
                <thead>
                  <tr>
                    <th scope="col">Tool</th>
                    <th scope="col">Category</th>
                    <th scope="col">Their price</th>
                    <th scope="col">The take</th>
                    <th scope="col">
                      <span className="x-sr">Read</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((c) => (
                    <tr key={c.slug}>
                      <th scope="row">
                        <span className="x-cmp__tool">
                          <Monogram text={c.monogram} size="sm" />
                          <span>
                            {c.name}
                            <small>{c.maker}</small>
                          </span>
                        </span>
                      </th>
                      <td className="x-cmp__muted" data-label="Category">
                        {c.category}
                      </td>
                      <td className="x-cmp__num" data-label="Their price">
                        {c.price}
                      </td>
                      <td data-label="The take">{c.take}</td>
                      <td className="x-cmp__readcell">
                        <Link className="x-cmp__read" href={`/compare/${c.slug}`}>
                          vs Mimi <span className="x-arr">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CheckedLine>{tableNote}</CheckedLine>
          </section>

          <section className="x-cmp__sec" id="all" aria-labelledby="all-h">
            <p className="x-label">All comparisons</p>
            <h2 className="x-cmp__h2" id="all-h">
              Read the full comparisons
            </h2>
            <div className="x-cmp__cards">
              {comparisons.map((c) => (
                <CompareCard key={c.slug} c={c} />
              ))}
            </div>
          </section>

          <section className="x-cmp__sec" id="alongside" aria-labelledby="alongside-h">
            <p className="x-label">Alongside Mimi</p>
            <h2 className="x-cmp__h2" id="alongside-h">
              Other tools you may use alongside Mimi
            </h2>
            <p className="x-cmp__p">
              These are good tools that do a different job. Many distributors and shops use them, and Mimi is
              not trying to replace them.
            </p>
            <div className="x-cmp__tablewrap">
              <table className="x-cmp__table x-cmp__table--stack">
                <thead>
                  <tr>
                    <th scope="col">Tool</th>
                    <th scope="col">What it is</th>
                    <th scope="col">How it sits next to Mimi</th>
                  </tr>
                </thead>
                <tbody>
                  {alongside.map((r) => (
                    <tr key={r.tool}>
                      <th scope="row">{r.tool}</th>
                      <td className="x-cmp__muted" data-label="What it is">
                        {r.what}
                      </td>
                      <td data-label="Next to Mimi">{r.next}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CheckedLine>{alongsideNote}</CheckedLine>
          </section>

          <section className="x-cmp__sec" id="questions" aria-labelledby="questions-h">
            <p className="x-label">Questions</p>
            <h2 className="x-cmp__h2" id="questions-h">
              Fair questions
            </h2>
            <div className="x-faq x-cmp__faq">
              {compareFaq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
            <div className="x-cmp__markrow" aria-hidden="true">
              <MimiMark size="sm" />
              <span className="x-label">Mimi is pre-launch. Pilots first.</span>
            </div>
          </section>
        </div>
      </div>
      <CompareCta />
    </>
  );
}

export function CompareCta() {
  return (
    <CtaBand
      label={compareCta.small}
      title={compareCta.title}
      lead={compareCta.sub}
      actions={
        <ButtonLink href={compareCta.href} arrow>
          {compareCta.button}
        </ButtonLink>
      }
    />
  );
}
