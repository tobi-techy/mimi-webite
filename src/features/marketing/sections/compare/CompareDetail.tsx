import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import {
  COMPARE_CHECKED,
  compareCta,
  otherComparisons,
  type Comparison,
} from "@/features/marketing/content/compare";
import { CompareCta } from "./CompareHub";
import { CheckedLine, CompareCard, MimiMark, Monogram, RatedText } from "./CompareParts";
import { CompareRail, type RailItem } from "./CompareRail";

const rail: RailItem[] = [
  { id: "intro", label: "Intro" },
  { id: "overview", label: "Overview" },
  { id: "numbers", label: "By the numbers" },
  { id: "side-by-side", label: "Side by side" },
  { id: "without", label: "Without Mimi" },
  { id: "with", label: "With Mimi" },
  { id: "questions", label: "Questions" },
  { id: "sources", label: "Sources" },
  { id: "keep-reading", label: "Keep reading" },
];

const isExternal = (url: string) => url.startsWith("http");

/** /compare/[slug]: one tool against Mimi, every competitor fact cited below. */
export function CompareDetail({ c }: { c: Comparison }) {
  return (
    <>
      <div className="x-wrap x-cmp">
        <CompareRail items={rail} />
        <article className="x-cmp__body">
          <header className="x-cmp__hero" id="intro">
            <p className="x-cmp__crumbs x-mono">
              <Link href="/compare">Compare</Link> <span aria-hidden="true">/</span> {c.name}
            </p>
            <p className="x-cmp__date x-mono">Checked {COMPARE_CHECKED}</p>
            <p className="x-label">{c.category}</p>
            <h1 className="x-cmp__h1">
              {c.name} vs Mimi: {c.hook}
            </h1>
            <div className="x-btns">
              <ButtonLink href={compareCta.href} arrow>
                {compareCta.button}
              </ButtonLink>
              <ButtonLink href="/compare" variant="ghost">
                All comparisons
              </ButtonLink>
            </div>
          </header>

          <section className="x-cmp__sec x-cmp__sec--tight" id="overview" aria-label="Overview">
            <div className="x-cmp__versus">
              <div className="x-cmp__side">
                <Monogram text={c.monogram} size="lg" label={`${c.name} monogram`} />
                <span>
                  <b>{c.name}</b>
                  <small>{c.maker}</small>
                </span>
              </div>
              <span className="x-cmp__vsbig x-mono">vs</span>
              <div className="x-cmp__side">
                <MimiMark size="lg" />
                <span>
                  <b>Mimi</b>
                  <small>WhatsApp helpers for distributors · pre-launch</small>
                </span>
              </div>
              <Sticker src="sticker-stamp" pos="flow" w={84} r="-9deg" className="x-cmp__stk" />
            </div>
            <p className="x-cmp__p x-cmp__p--lg">{c.summary}</p>
            <div className="x-cmp__verdict">
              <p className="x-label">
                <i aria-hidden="true" /> The verdict
              </p>
              <p>{c.verdict}</p>
            </div>
          </section>

          <section className="x-cmp__sec" id="numbers" aria-labelledby="numbers-h">
            <p className="x-label">By the numbers</p>
            <h2 className="x-cmp__h2" id="numbers-h">
              {c.slug === "the-old-way" ? "What Mimi changes" : `${c.name} in three numbers`}
            </h2>
            <div className="x-cmp__stats">
              {c.stats.map((s) => (
                <div className="x-cmp__stat" key={s.caption}>
                  <p className="x-cmp__fig">{s.figure}</p>
                  <p className="x-cmp__cap x-mono">
                    {s.caption}{" "}
                    <a href={`#src-${s.src}`} aria-label={`Source ${s.src}`}>
                      [{s.src}]
                    </a>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="x-cmp__sec" id="side-by-side" aria-labelledby="sbs-h">
            <p className="x-label">Side by side</p>
            <h2 className="x-cmp__h2" id="sbs-h">
              Where it counts
            </h2>
            <div className="x-cmp__tablewrap">
              <table className="x-cmp__table x-cmp__table--sbs x-cmp__table--stack">
                <thead>
                  <tr>
                    <th scope="col">Where it counts</th>
                    <th scope="col">
                      <span className="x-cmp__thmark">
                        <Monogram text={c.monogram} size="sm" /> {c.name}
                      </span>
                    </th>
                    <th scope="col" className="is-mimi">
                      <span className="x-cmp__thmark">
                        <MimiMark size="sm" /> Mimi
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.label}>
                      <th scope="row">{r.label}</th>
                      <td data-label={c.name}>
                        <RatedText text={r.them} />
                      </td>
                      <td className="is-mimi" data-label="Mimi">
                        <RatedText text={r.mimi} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CheckedLine>
              {c.slug === "the-old-way"
                ? "Mimi is pre-launch. Collector and Proof run in pilots first, before general release."
                : `As listed on ${c.name}'s website, checked ${COMPARE_CHECKED}. Pricing and features may have changed. “Not listed” means we could not find it on their public site. Mimi is pre-launch; Collector and Proof run in pilots first.`}
            </CheckedLine>
          </section>

          <section className="x-cmp__sec x-cmp__sec--half" id="without" aria-labelledby="without-h">
            <p className="x-label">Without Mimi</p>
            <h2 className="x-cmp__h3" id="without-h">
              {c.without.title}
            </h2>
            <p className="x-cmp__p">{c.without.body}</p>
          </section>
          <section
            className="x-cmp__sec x-cmp__sec--half x-cmp__sec--with"
            id="with"
            aria-labelledby="with-h"
          >
            <p className="x-label">
              <i className="x-cmp__dot" aria-hidden="true" /> With Mimi
            </p>
            <h2 className="x-cmp__h3" id="with-h">
              {c.with.title}
            </h2>
            <p className="x-cmp__p">{c.with.body}</p>
          </section>

          {c.deep.map((d) => (
            <section className="x-cmp__sec x-cmp__deep" key={d.title}>
              <p className="x-label">{d.eyebrow}</p>
              <h3 className="x-cmp__h3">{d.title}</h3>
              <p className="x-cmp__p">{d.body}</p>
              <ul className="x-cmp__bullets">
                {d.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="x-cmp__sec" id="questions" aria-labelledby="questions-h">
            <p className="x-label">Questions</p>
            <h2 className="x-cmp__h2" id="questions-h">
              Fair questions
            </h2>
            <div className="x-faq x-cmp__faq">
              {c.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
            <div className="x-cmp__related">
              <p className="x-label">Related searches</p>
              <ul>
                {c.related.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="x-cmp__sec" id="sources" aria-labelledby="sources-h">
            <p className="x-label">Sources</p>
            <h2 className="x-cmp__h3" id="sources-h">
              Where every fact comes from
            </h2>
            <ol className="x-cmp__sources">
              {c.sources.map((s, i) => (
                <li key={s.url + s.label} id={`src-${i + 1}`}>
                  <span className="x-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {isExternal(s.url) ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      <Link href={s.url}>{s.label}</Link>
                    )}
                    <small className="x-mono">
                      {isExternal(s.url)
                        ? s.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
                        : "mimi page"}{" "}
                      · checked {COMPARE_CHECKED}
                      {s.note ? ` · ${s.note}` : ""}
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="x-cmp__sec" id="keep-reading" aria-labelledby="keep-h">
            <p className="x-label">Keep reading</p>
            <h2 className="x-cmp__h2" id="keep-h">
              More comparisons
            </h2>
            <div className="x-cmp__cards">
              {otherComparisons(c.slug).map((o) => (
                <CompareCard key={o.slug} c={o} />
              ))}
            </div>
          </section>
        </article>
      </div>
      <CompareCta />
    </>
  );
}
