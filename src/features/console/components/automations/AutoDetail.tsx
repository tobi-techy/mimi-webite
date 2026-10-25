"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScopeFaces } from "@/features/console/components/automations/AutomationsList";
import { AutoDiagram, ChannelIcon, Crumbs, autoRoutes } from "@/features/console/components/automations/parts";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Markdown } from "@/features/console/components/panel/Markdown";
import { Icon } from "@/features/console/components/ui/Icon";
import { scopeLabel, triggerLabel } from "@/features/console/content/automations";
import { conversationHref, runAutomation, toggleAutomation } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";

const statusWord = { done: "Done", needs: "Needs you", failed: "Failed", run: "Running" } as const;

/** One automation: what it does, its settings, its instructions and every run (each links to its thread). */
export function AutoDetail({ id }: { id: string }) {
  const a = useDemo((s) => s.autos.find((x) => x.id === id));
  const on = useDemo((s) => !!s.automations[id]);
  const convs = useDemo((s) => s.conversations);
  const router = useRouter();
  const say = useToast();
  if (!a)
    return (
      <>
        <Crumbs items={[{ label: "Automations", href: autoRoutes.list }, { label: "Not found" }]} />
        <p className="x-atbl__empty">This automation isn&apos;t in the demo any more.</p>
      </>
    );
  const href = (slug: string) => {
    const c = convs.find((x) => x.slug === slug);
    return c ? conversationHref(c) : undefined;
  };
  return (
    <>
      <Crumbs items={[{ label: "Automations", href: autoRoutes.list }, { label: a.title }]} />
      <header className="x-adh">
        <HelperFace name={a.helper} size={44} />
        <div className="x-adh__t">
          <h1>{a.title}</h1>
          <p>{a.description}</p>
        </div>
        <div className="x-adh__a">
          <span className={cx("x-adh__on", on && "is-on")}>
            <button
              className="c-toggle"
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${a.title} on`}
              onClick={() => {
                toggleAutomation(a.id, !on);
                sfx("console", "toggle", { direction: !on ? "forward" : "back" });
                say(`${a.title} ${!on ? "turned on" : "paused"}`);
              }}
            />
            {on ? "On" : "Paused"}
          </span>
          <button
            type="button"
            className="x-abtn x-abtn--or"
            onClick={() => {
              const slug = runAutomation(a.id);
              if (slug) router.push(`/console/threads/new?id=${slug}`);
            }}
          >
            <Icon name="play" />
            Run now
          </button>
        </div>
      </header>
      <div className="x-adg-wrap">
        <AutoDiagram trigger={triggerLabel(a.trigger).toUpperCase()} helper={a.helper} result={a.lands.toUpperCase()} />
      </div>
      <div className="x-adcols">
        <section className="x-adsec" aria-labelledby="ad-runs">
          <h2 id="ad-runs">
            Runs <span>{a.runs.length}</span>
          </h2>
          {a.runs.length === 0 ? (
            <p className="x-atbl__empty">No runs yet. The first one starts when the trigger fires, or tap Run now.</p>
          ) : (
            <ul className="x-aruns">
              {a.runs.map((r) => {
                const to = r.thread ? href(r.thread) : undefined;
                const body = (
                  <>
                    <span className={cx("x-aruns__s", `is-${r.status}`)}>
                      {r.status === "run" ? <i className="mc-spin" aria-hidden="true" /> : <i className={cx("x-ast", `x-ast--${r.status}`)} aria-hidden="true" />}
                      {statusWord[r.status]}
                    </span>
                    <span className="x-aruns__m">
                      {r.summary}
                      <small>{r.at}</small>
                    </span>
                    {to ? (
                      <span className="x-aruns__go">
                        Open thread
                        <Icon name="arrow-right" />
                      </span>
                    ) : (
                      <span className="x-aruns__go is-off">No thread kept</span>
                    )}
                  </>
                );
                return <li key={r.id}>{to ? <Link href={to}>{body}</Link> : <div>{body}</div>}</li>;
              })}
            </ul>
          )}
        </section>
        <aside className="x-adsec" aria-labelledby="ad-set">
          <h2 id="ad-set">Settings</h2>
          <dl className="x-adkv">
            <div>
              <dt>Trigger</dt>
              <dd>
                {a.trigger.kind === "schedule" ? "Schedule" : "Event"} · {triggerLabel(a.trigger)}
              </dd>
            </div>
            <div>
              <dt>Helper</dt>
              <dd>
                <HelperFace name={a.helper} size={16} /> {a.helper}
              </dd>
            </div>
            <div>
              <dt>Shops</dt>
              <dd>
                <ScopeFaces a={a} /> {scopeLabel(a.scope)}
              </dd>
            </div>
            <div>
              <dt>Approval</dt>
              <dd>{a.approval ? "Needed before sending" : "Sends without asking"}</dd>
            </div>
            <div>
              <dt>Quiet hours</dt>
              <dd>{a.quiet}</dd>
            </div>
            <div>
              <dt>Max per shop</dt>
              <dd>{a.maxPerWeek} a week</dd>
            </div>
            <div>
              <dt>Results</dt>
              <dd>{a.lands}</dd>
            </div>
            <div>
              <dt>Uses</dt>
              <dd className="x-adkv__ch">
                {a.channels.map((c) => (
                  <ChannelIcon key={c} c={c} />
                ))}
              </dd>
            </div>
          </dl>
          <h2>Instructions</h2>
          <div className="x-adins">
            <Markdown text={a.instructions} className="mc-md--msg" />
          </div>
          <p className="x-adguard">
            <Icon name="shield-check" />
            Mimi proposes, code checks, you approve. Money never moves.
          </p>
        </aside>
      </div>
    </>
  );
}
