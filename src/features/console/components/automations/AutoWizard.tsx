"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { AutoDiagram, Crumbs, autoRoutes } from "@/features/console/components/automations/parts";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Markdown } from "@/features/console/components/panel/Markdown";
import { Icon } from "@/features/console/components/ui/Icon";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import {
  AREAS,
  DAYS,
  autoEvents,
  resultPlaces,
  scheduleLabel,
  scopeLabel,
  shopTags,
  templates,
  triggerLabel,
  type AutoEvent,
  type AutoTrigger,
  type ResultPlace,
  type ShopScope,
} from "@/features/console/content/automations";
import { shops } from "@/features/console/content/shops";
import { createAutomation } from "@/features/console/demo/engine";
import { helperJobs } from "@/features/console/demo/seed";
import { helperNames, type HelperName } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

const STEPS = ["Name", "Trigger", "Where it runs", "Instructions", "Additional settings"] as const;
const TIMES = ["06:00", "07:00", "08:00", "08:30", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const QUIET = ["9pm to 7am", "10pm to 6am", "8pm to 8am", "None"];
const BLANK_INSTRUCTIONS =
  "Describe the job in plain words.\n\n1. What to check first.\n2. What to draft.\n3. When to ask me.\n\n## Never\n- Move money or promise discounts.";

function Field({ label, help, children, id }: { label: string; help?: string; children: ReactNode; id: string }) {
  return (
    <div className="x-af">
      <label className="x-af__l" htmlFor={id}>
        {label}
      </label>
      {children}
      {help && <p className="x-af__h">{help}</p>}
    </div>
  );
}

function Choice({ on, onClick, children, role = "radio" }: { on: boolean; onClick: () => void; children: ReactNode; role?: string }) {
  return (
    <button type="button" role={role} aria-checked={on} className={cx("x-ach2", on && "is-on")} onClick={onClick}>
      {children}
    </button>
  );
}

const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${(h ?? 0) % 12 || 12}:${String(m ?? 0).padStart(2, "0")} ${(h ?? 0) < 12 ? "am" : "pm"}`;
};

/** /console/automations/new: Factory's five-step wizard, prefilled from a template when one is picked. */
export function AutoWizard() {
  const params = useSearchParams();
  const tpl = templates.find((t) => t.id === params.get("template"));
  const router = useRouter();
  const uid = useId();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(tpl?.title ?? "");
  const [desc, setDesc] = useState(tpl?.description ?? "");
  const [trigger, setTrigger] = useState<AutoTrigger>(tpl?.trigger ?? { kind: "schedule", days: ["Mon"], time: "08:00" });
  const [helper, setHelper] = useState<HelperName>(tpl?.helper ?? "Collector");
  const [scope, setScope] = useState<ShopScope>(tpl?.scope ?? { mode: "all" });
  const [instructions, setInstructions] = useState(tpl?.instructions ?? BLANK_INSTRUCTIONS);
  const [preview, setPreview] = useState(false);
  const [approval, setApproval] = useState(true);
  const [quiet, setQuiet] = useState(QUIET[0]!);
  const [maxPerWeek, setMax] = useState(2);
  const [lands, setLands] = useState<ResultPlace>(tpl?.lands ?? "WhatsApp to owner");
  const title = tpl ? `New ${tpl.title} automation` : "New automation";
  const canNext = step !== 0 || name.trim().length > 0;
  const id = (k: string) => `${uid}-${k}`;

  function create() {
    const newId = createAutomation({
      title: name.trim() || "Untitled automation",
      description: desc.trim() || "Made in the wizard.",
      helper,
      trigger,
      scope,
      channels: tpl?.channels ?? ["whatsapp"],
      instructions,
      approval,
      quiet,
      maxPerWeek,
      lands,
    });
    router.push(autoRoutes.detail(newId, true));
  }

  const sched = trigger.kind === "schedule" ? trigger : null;
  const event = trigger.kind === "event" ? trigger : null;
  const toggleDay = (d: string) => {
    if (!sched) return;
    const days = sched.days.includes(d) ? sched.days.filter((x) => x !== d) : [...sched.days, d];
    setTrigger({ ...sched, monthly: undefined, days: days.length ? days : [d] });
  };
  const listShops = scope.shops ?? [];

  return (
    <div className="x-awz">
      <div className="x-awz__top">
        <Crumbs items={[{ label: "Automations", href: autoRoutes.list }, { label: "Templates", href: autoRoutes.templates }, { label: title }]} />
      </div>
      <ol className="x-astep" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className={cx(i === step && "is-on", i < step && "is-done")} aria-current={i === step ? "step" : undefined}>
            <button type="button" onClick={() => (i <= step || canNext ? setStep(i) : undefined)} disabled={i > step && !canNext}>
              <span className="x-astep__n">{i < step ? <Icon name="check" /> : i + 1}</span>
              <span className="x-astep__l">{s}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="x-awz__body">
        <div className="x-awz__form">
          {step === 0 && (
            <>
              <h2 className="x-awz__h">Name your automation</h2>
              <p className="x-awz__s">{tpl ? `Prefilled from the ${tpl.title} template. You can rename it any time.` : "Give it a name your team will recognise."}</p>
              <Field id={id("name")} label="Name" help="Shown in your Automations list and on every thread this automation starts.">
                <input id={id("name")} className="x-ain" value={name} placeholder="Monday debt chase" onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field id={id("desc")} label="Description" help="Helps your team understand what this automation does.">
                <textarea id={id("desc")} className="x-ain x-ain--ta" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="x-awz__h">When should it run?</h2>
              <p className="x-awz__s">On a schedule, or each time something happens in your business.</p>
              <div className="x-aseg" role="radiogroup" aria-label="Trigger type">
                <Choice on={!!sched} onClick={() => setTrigger({ kind: "schedule", days: ["Mon"], time: "08:00" })}>
                  <Icon name="calendar-clock" />
                  <span>
                    On a schedule
                    <small>Every Monday, weekdays, month-end</small>
                  </span>
                </Choice>
                <Choice on={!!event} onClick={() => setTrigger({ kind: "event", event: "bank-alert" })}>
                  <Icon name="zap" />
                  <span>
                    When something happens
                    <small>A bank alert, a delivery, low stock</small>
                  </span>
                </Choice>
              </div>
              {sched && (
                <>
                  <Field id={id("days")} label="Days" help={sched.monthly ? "Runs once a month." : "Pick one or more days."}>
                    <div className="x-adays" id={id("days")} role="group" aria-label="Days">
                      {DAYS.map((d) => (
                        <button key={d} type="button" aria-pressed={!sched.monthly && sched.days.includes(d)} className={cx(!sched.monthly && sched.days.includes(d) && "is-on")} onClick={() => toggleDay(d)}>
                          {d}
                        </button>
                      ))}
                      <span className="x-adays__or">or</span>
                      <button type="button" aria-pressed={sched.monthly === "first"} className={cx(sched.monthly === "first" && "is-on")} onClick={() => setTrigger({ ...sched, monthly: "first" })}>
                        1st of month
                      </button>
                      <button type="button" aria-pressed={sched.monthly === "last"} className={cx(sched.monthly === "last" && "is-on")} onClick={() => setTrigger({ ...sched, monthly: "last" })}>
                        Month-end
                      </button>
                    </div>
                  </Field>
                  <Field id={id("time")} label="Time" help="Lagos time (WAT).">
                    <select id={id("time")} className="x-ain x-ain--sel" value={sched.time} onChange={(e) => setTrigger({ ...sched, time: e.target.value })}>
                      {TIMES.map((t) => (
                        <option key={t} value={t}>
                          {time12(t)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </>
              )}
              {event && (
                <>
                  <Field id={id("ev")} label="Event">
                    <div className="x-aevl" role="radiogroup" id={id("ev")} aria-label="Event">
                      {autoEvents.map((e) => (
                        <Choice key={e.id} on={event.event === e.id} onClick={() => setTrigger({ kind: "event", event: e.id as AutoEvent, value: e.id === "stock-low" ? 20 : e.id === "quiet" ? 10 : undefined })}>
                          <i className="x-aevl__r" aria-hidden="true" />
                          <span>{e.label}</span>
                        </Choice>
                      ))}
                    </div>
                  </Field>
                  {(event.event === "stock-low" || event.event === "quiet") && (
                    <Field id={id("n")} label={event.event === "stock-low" ? "Level (cartons)" : "Quiet for (days)"} help={event.event === "stock-low" ? "Runs when any product falls below this many cartons." : "Runs when a shop hasn't ordered for this many days."}>
                      <input id={id("n")} type="number" min={1} className="x-ain x-ain--num" value={event.value ?? 10} onChange={(e) => setTrigger({ ...event, value: Math.max(1, Number(e.target.value) || 1) })} />
                    </Field>
                  )}
                </>
              )}
              <p className="x-awz__pv">
                <Icon name={sched ? "calendar-clock" : "zap"} />
                {sched && !sched.monthly ? scheduleLabel(sched.days, sched.time) : triggerLabel(trigger)}
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="x-awz__h">Where it runs</h2>
              <p className="x-awz__s">Which helper does the work, and for which shops.</p>
              <Field id={id("h")} label="Helper">
                <div className="x-ahelp" role="radiogroup" id={id("h")} aria-label="Helper">
                  {helperNames.map((h) => (
                    <Choice key={h} on={helper === h} onClick={() => setHelper(h)}>
                      <HelperFace name={h} size={28} />
                      <span>
                        {h}
                        <small>{helperJobs[h]}</small>
                      </span>
                    </Choice>
                  ))}
                </div>
              </Field>
              <Field id={id("sc")} label="Shops" help={scopeLabel(scope)}>
                <div className="x-aseg x-aseg--4" role="radiogroup" id={id("sc")} aria-label="Shops">
                  {(["all", "area", "list", "tag"] as const).map((m) => (
                    <Choice key={m} on={scope.mode === m} onClick={() => setScope({ mode: m, area: scope.area ?? "Oshodi", tag: scope.tag ?? "Late payers", shops: scope.shops ?? shops.slice(0, 3).map((s) => s.name) })}>
                      <span>{m === "all" ? "All shops" : m === "area" ? "One area" : m === "list" ? "Pick shops" : "By tag"}</span>
                    </Choice>
                  ))}
                </div>
              </Field>
              {scope.mode === "all" && (
                <div className="x-astack">
                  {shops.slice(0, 8).map((s) => (
                    <ShopAvatar key={s.id} name={s.name} size={28} />
                  ))}
                  <span>+{shops.length - 8} more · new shops join automatically</span>
                </div>
              )}
              {scope.mode === "area" && (
                <div className="x-adays">
                  {AREAS.map((a) => (
                    <button key={a} type="button" aria-pressed={scope.area === a} className={cx(scope.area === a && "is-on")} onClick={() => setScope({ ...scope, area: a })}>
                      {a} <span>{shops.filter((s) => s.route === a).length}</span>
                    </button>
                  ))}
                </div>
              )}
              {scope.mode === "tag" && (
                <div className="x-adays">
                  {shopTags.map((t) => (
                    <button key={t} type="button" aria-pressed={scope.tag === t} className={cx(scope.tag === t && "is-on")} onClick={() => setScope({ ...scope, tag: t })}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
              {scope.mode === "list" && (
                <ul className="x-ashops" aria-label="Pick shops">
                  {shops.slice(0, 12).map((s) => {
                    const on = listShops.includes(s.name);
                    return (
                      <li key={s.id}>
                        <button type="button" role="checkbox" aria-checked={on} className={cx(on && "is-on")} onClick={() => setScope({ ...scope, shops: on ? listShops.filter((x) => x !== s.name) : [...listShops, s.name] })}>
                          <ShopAvatar name={s.name} size={28} />
                          <span>
                            {s.name}
                            <small>
                              {s.area} · {s.route}
                            </small>
                          </span>
                          <i className="x-ashops__ck" aria-hidden="true">
                            {on && <Icon name="check" />}
                          </i>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="x-awz__h">Instructions</h2>
              <p className="x-awz__s">What {helper} should do each time it runs. Markdown works.</p>
              <div className="x-aseg x-aseg--sm" role="tablist" aria-label="Editor">
                <Choice role="tab" on={!preview} onClick={() => setPreview(false)}>
                  <span>Write</span>
                </Choice>
                <Choice role="tab" on={preview} onClick={() => setPreview(true)}>
                  <span>Preview</span>
                </Choice>
              </div>
              {preview ? (
                <div className="x-ain x-ain--pv">
                  <Markdown text={instructions} className="mc-md--msg" />
                </div>
              ) : (
                <Field id={id("ins")} label="Instructions" help="The helper reads this at the start of every run.">
                  <textarea id={id("ins")} className="x-ain x-ain--ta x-ain--code" rows={12} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                </Field>
              )}
              <div className="x-aguard">
                <Icon name="shield-check" />
                <div>
                  <b>Guardrails, always on</b>
                  <p>Mimi proposes, code checks, you approve. Helpers never move money, never chase a shop the bank shows has paid, and never message outside quiet hours. These can&apos;t be turned off by instructions.</p>
                </div>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="x-awz__h">Additional settings</h2>
              <p className="x-awz__s">How careful it is and where the results land.</p>
              <div className="x-arow">
                <div>
                  <b>Needs approval before sending</b>
                  <small>Anything that would reach a shop waits for your yes.</small>
                </div>
                <button type="button" className="c-toggle" role="switch" aria-checked={approval} aria-label="Needs approval before sending" onClick={() => setApproval(!approval)} />
              </div>
              {!approval && <p className="x-awarn">Reminders will go out without asking. Money still never moves.</p>}
              <div className="x-arow">
                <div>
                  <b>Quiet hours</b>
                  <small>No messages to shops in this window.</small>
                </div>
                <select className="x-ain x-ain--sel x-ain--sm" aria-label="Quiet hours" value={quiet} onChange={(e) => setQuiet(e.target.value)}>
                  {QUIET.map((q) => (
                    <option key={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="x-arow">
                <div>
                  <b>Max messages per shop</b>
                  <small>Per week, across every automation.</small>
                </div>
                <span className="x-astepper">
                  <button type="button" aria-label="Fewer" onClick={() => setMax(Math.max(1, maxPerWeek - 1))}>
                    −
                  </button>
                  <output aria-live="polite">{maxPerWeek}</output>
                  <button type="button" aria-label="More" onClick={() => setMax(Math.min(7, maxPerWeek + 1))}>
                    +
                  </button>
                </span>
              </div>
              <div className="x-arow x-arow--col">
                <div>
                  <b>Where results land</b>
                  <small>Every run also keeps its full thread in the console.</small>
                </div>
                <div className="x-aseg" role="radiogroup" aria-label="Where results land">
                  {resultPlaces.map((p) => (
                    <Choice key={p} on={lands === p} onClick={() => setLands(p)}>
                      <Icon name={p === "Email" ? "mail" : p === "Console thread" ? "message-square" : "whatsapp"} />
                      <span>{p}</span>
                    </Choice>
                  ))}
                </div>
              </div>
              <div className="x-awz__sum">
                <AutoDiagram trigger={triggerLabel(trigger).toUpperCase()} helper={helper} result={lands.toUpperCase()} />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="x-awz__ft">
        <div className="x-awz__fti">
          <Link className="x-abtn x-abtn--ghost" href={autoRoutes.list}>
            Cancel
          </Link>
          <span className="x-awz__k">
            Step {step + 1} of {STEPS.length}
          </span>
          <button type="button" className="x-abtn" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="x-abtn x-abtn--or" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="x-abtn x-abtn--or" onClick={create}>
              Create automation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
