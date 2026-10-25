import { ButtonLink, ButtonRow, TextLink } from "@/components/ui/Button";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { consoleMock } from "@/features/marketing/content/home";
import { routes } from "@/config/routes";
import { cx } from "@/lib/cx";

/** The console: an illustrative mock of the approvals screen. */
export function HomeConsole() {
  const c = consoleMock;
  return (
    <Section className="x-con" id="console">
      <Wrap>
        <SectionHeader
          label="The console"
          title="Your whole book, one screen."
          lead="Every shop, every rep, every naira owed. Mimi drafts the work, you approve it."
        />
        <div className="x-con__stage x-rv">
          <div className="x-con__win" role="img" aria-label={c.label}>
            <div className="x-con__bar" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
              <span className="x-mono">{c.host}</span>
            </div>
            <div className="x-con__body" aria-hidden="true">
              <aside className="x-con__side">
                <img className="x-con__logo" src="/brand/mimi-logo-horizontal-reverse.svg" alt="" />{" "}
                <ul className="x-con__nav">
                  {c.nav.map((n) => (
                    <li key={n.label} className={cx(n.className, n.on && "is-on") || undefined}>
                      {n.label}
                      {n.count && (
                        <>
                          {" "}
                          <span className="x-mono">{n.count}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="x-con__user">
                  <span className="x-con__av x-mono">{c.user.initials}</span>
                  <span>{c.user.name}</span>
                </div>
              </aside>
              <div className="x-con__main">
                <div className="x-con__head">
                  <h3>Approvals</h3>
                  <span className="x-mono">3 waiting</span>
                </div>
                {c.cards.map((card) => (
                  <div key={card.title} className="x-con__card">
                    <div className="x-con__ct">
                      <span className={cx("x-con__chip", card.warn && "is-warn", "x-mono")}>{card.chip}</span>
                      <p>{card.title}</p>
                      <p className="x-con__sub">{card.sub}</p>
                    </div>
                    {card.actions && (
                      <div className="x-con__acts">
                        <span className="x-con__b is-pri">Approve</span>
                        <span className="x-con__b">Edit</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="x-con__live" aria-hidden="true">
              <div className="x-con__lh x-mono">
                <span className="x-con__pulse"></span>
                {c.live.title}
              </div>
              <div className="x-con__screen">
                {c.live.bars.map((w, i) => (
                  <i key={i} style={{ width: w }}></i>
                ))}
              </div>
              <p className="x-con__cap">{c.live.caption}</p>
            </div>
          </div>
        </div>
        <ul className="x-con__facts x-mono x-rv x-stag">
          {c.facts.map((f, i) => (
            <li key={f} style={{ "--si": String(i) }}>
              {f}
            </li>
          ))}
        </ul>
        <ButtonRow className="x-con__cta" reveal>
          <ButtonLink href="/contact">Book a pilot</ButtonLink>{" "}
          <TextLink href={routes.console} arrow>
            Try the console demo
          </TextLink>
        </ButtonRow>
      </Wrap>
    </Section>
  );
}
